"""Generate exact upstream notices from installed packages and resolved Android artifacts."""
import io,json,pathlib,re,zipfile,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
lock=json.loads((root/'package-lock.json').read_text(encoding='utf8'))
chunks=['THIRD-PARTY SOFTWARE NOTICES\n내 방식 QR: third-party license inventory\n\nThis file covers installed JavaScript dependencies (including build tools) and resolved Android runtime artifacts. Inclusion in the inventory does not assert that every package is embedded in the APK or Worker. This notice does not license the project itself. Upstream packages were not manually modified. Normal bundling/minification may be applied.\n']
rows=[];missing=[];seen=set()
def license_files(folder):
 result=[]
 def walk(path,depth):
  if depth>4:return
  for child in sorted(path.iterdir()):
   if child.name=='node_modules' or child.is_symlink():continue
   if child.is_dir():
    if child.name not in ['.git','test','tests','fixtures']:walk(child,depth+1)
   elif re.match(r'^(licen[sc]es?|copying|notice)(\.|$|-)',child.name,re.I):result.append(child)
 walk(folder,0);return result
for location,meta in sorted(lock.get('packages',{}).items()):
 if not location or not (root/location/'package.json').exists():continue
 p=json.loads((root/location/'package.json').read_text(encoding='utf8'))
 name=p.get('name',location);version=p.get('version',meta.get('version','unknown'))
 identity=(name,version)
 if identity in seen:continue
 seen.add(identity)
 license=p.get('license') or meta.get('license') or p.get('licenses') or 'UNKNOWN'
 if not isinstance(license,str):license=json.dumps(license)
 source=meta.get('resolved','')
 if not source.startswith('https://registry.npmjs.org/'):source='https://www.npmjs.com/package/'+name+'/v/'+version
 files=license_files(root/location)
 row={'name':name,'version':version,'license':license,'developmentOnlyInLock':bool(meta.get('dev')),'source':source,'noticeFiles':len(files)};rows.append(row)
 repo=p.get('repository','');repo=repo.get('url','') if isinstance(repo,dict) else repo
 repo=str(repo).removeprefix('git+').removesuffix('.git')
 if repo.startswith('git://'):repo='https://'+repo[6:]
 row['repository']=repo
 chunks.append('\n'+'='*72+'\n'+name+' @ '+version+'\nDeclared license: '+license+'\nExact upstream package: '+source+'\nUpstream source repository: '+repo+'\nCovered source remains available under the upstream license; consult the exact version/tag when redistributing covered binaries.\n')
 if license=='CC-BY-4.0':chunks.append('Attribution: caniuse.com and caniuse-lite contributors. Upstream data not manually modified. https://caniuse.com/ — https://creativecommons.org/licenses/by/4.0/\n')
 if not files:missing.append({'name':name,'version':version,'license':license,'source':source});chunks.append('No separate license file included in this installed package; see upstream source above.\n')
 for file in files:
  if file.stat().st_size>2*1024*1024:raise RuntimeError('Notice too large: '+name)
  text=file.read_text(encoding='utf8',errors='replace');chunks.append('\n--- '+file.relative_to(root/location).as_posix()+' ---\n'+text+'\n')
starter=root/'build/sites-vite-plugin.LICENSE'
if starter.exists():chunks.append('\n'+'='*72+'\nSites build integration license\n'+starter.read_text(encoding='utf8')+'\n')
android=[];android_file=root/'.sites-runtime/android-runtime.json'
if not android_file.exists():raise RuntimeError('Resolve Android runtime artifacts before generating notices')
cache=root/'.sites-runtime/gradle/caches/modules-2/files-2.1'
ns={'m':'http://maven.apache.org/POM/4.0.0'}
for a in json.loads(android_file.read_text(encoding='utf8')):
 coord=a['group']+':'+a['name']+':'+a['version']
 if a['version']=='unspecified':continue
 candidates=list((cache/a['group']/a['name']/a['version']).rglob('*.pom'))
 licenses=[]
 for pom in candidates[:1]:
  tree=ET.parse(pom)
  for el in tree.findall('.//m:licenses/m:license',ns):licenses.append({'name':el.findtext('m:name',default='',namespaces=ns),'url':el.findtext('m:url',default='',namespaces=ns)})
 base='https://dl.google.com/dl/android/maven2/' if a['group'].startswith(('androidx.','com.android.')) else 'https://repo.maven.apache.org/maven2/'
 source=base+a['group'].replace('.','/')+'/'+a['name']+'/'+a['version']+'/'
 android.append({'coordinate':coord,'licenses':licenses,'source':source})
 chunks.append('\n'+'='*72+'\nAndroid runtime: '+coord+'\nSource/artifact metadata: '+source+'\nDeclared licenses: '+json.dumps(licenses,ensure_ascii=False)+'\n')
 if not licenses:missing.append({'name':coord,'license':'POM license metadata missing','source':source})
 artifact=pathlib.Path(a['file'])
 if artifact.exists() and artifact.suffix in ['.jar','.aar']:
  with zipfile.ZipFile(artifact) as z:
   for name in z.namelist():
    if re.search(r'(^|/)(LICENSE|NOTICE|COPYING)(\.|$|-)',name,re.I):chunks.append('\n--- '+name+' ---\n'+z.read(name).decode('utf8','replace')+'\n')
   if 'classes.jar' in z.namelist():
    with zipfile.ZipFile(io.BytesIO(z.read('classes.jar'))) as jar:
     for name in jar.namelist():
      if re.search(r'(^|/)(LICENSE|NOTICE|COPYING)(\.|$|-)',name,re.I):chunks.append('\n--- classes.jar!'+name+' ---\n'+jar.read(name).decode('utf8','replace')+'\n')
# Include the full Apache text for AndroidX/Kotlin/other Apache runtime libraries.
apache=root/'node_modules/typescript/LICENSE.txt'
if apache.exists():chunks.append('\n'+'='*72+'\nApache License 2.0 reference text\n'+apache.read_text(encoding='utf8')+'\n')
text='\n'.join(chunks)
for dest in ['THIRD_PARTY_NOTICES.txt','public/third-party-notices.txt','mobile/public/third-party-notices.txt']:
 path=root/dest;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf8')
report={'packages':rows,'androidRuntime':android,'manualReview':missing,'notes':['SPDX/package metadata and exact license texts are recorded; this is not commercial legal clearance.','MPL/LGPL distribution obligations depend on which binaries/source files are actually redistributed.']}
(root/'deliverables/license-inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'javascriptPackages':len(rows),'androidArtifacts':len(android),'manualReview':len(missing),'noticeBytes':len(text.encode())}))

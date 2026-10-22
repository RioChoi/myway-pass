"""Read-only secret audit. Outputs paths/categories, never secret values or matching lines."""
import io, json, os, pathlib, re, subprocess, zipfile
root=pathlib.Path(__file__).resolve().parents[1]
os.chdir(root)
def git(*args):
 return subprocess.check_output(['git','-c','safe.directory='+root.as_posix(),*args])
known=[]
for filename in ['.env.local','.dev.vars']:
 p=root/filename
 if not p.exists():continue
 for line in p.read_text(encoding='utf-8-sig').splitlines():
  m=re.match(r'\s*(?:export\s+)?([A-Z0-9_]*(?:KEY|TOKEN|PASSWORD|SECRET)[A-Z0-9_]*)\s*=\s*(.*?)\s*$',line)
  if m:
   value=m.group(2).strip('"\'')
   if len(value)>=12 and 'placeholder' not in value and not value.startswith('test-'):known.append(value.encode())
patterns={
 'api_key_pattern':re.compile(rb'\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,})'),
 'private_key':re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'credential_in_database_url':re.compile(rb'(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|rediss?)://[^/\s:@]+:[^/\s@]+@'),
 'jwt_literal':re.compile(rb'\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{20,}'),
}
findings=[];counts={'workingFiles':0,'archiveEntries':0,'gitBlobs':0,'gitCommits':0};seen=set()
def inspect(data,location,archives=True):
 categories=[]
 if any(key in data for key in known):categories.append('configured_secret')
 categories.extend(name for name,pattern in patterns.items() if pattern.search(data))
 if categories:findings.append({'location':location,'categories':categories})
 if archives and data[:4]==b'PK\x03\x04':
  try:
   with zipfile.ZipFile(io.BytesIO(data)) as z:
    for entry in z.infolist():
     if entry.is_dir():continue
     if entry.file_size>50*1024*1024:raise ValueError('oversize archive entry')
     counts['archiveEntries']+=1;inspect(z.read(entry),location+'!'+entry.filename,False)
  except (zipfile.BadZipFile,ValueError):findings.append({'location':location,'categories':['archive_not_fully_scanned']})
tracked=git('ls-files','-z').decode().split('\0')
untracked=git('ls-files','--others','--exclude-standard','-z').decode().split('\0')
for name in sorted(set(tracked+untracked)):
 if not name or name=='.env.example':continue
 p=root/name
 if p.is_file():counts['workingFiles']+=1;inspect(p.read_bytes(),name)
for folder in ['dist','mobile/dist']:
 for p in (root/folder).rglob('*'):
  if p.is_file():counts['workingFiles']+=1;inspect(p.read_bytes(),p.relative_to(root).as_posix())
source_zip=root/'deliverables/myway-pass-source.zip'
if source_zip.exists():inspect(source_zip.read_bytes(),'deliverables/myway-pass-source.zip')
objects=git('rev-list','--objects','--all').decode().splitlines();ids=[];names={}
for line in objects:
 sha,_,name=line.partition(' ');ids.append(sha);names.setdefault(sha,name)
proc=subprocess.run(['git','-c','safe.directory='+root.as_posix(),'cat-file','--batch'],input=('\n'.join(ids)+'\n').encode(),stdout=subprocess.PIPE,check=True)
out=io.BytesIO(proc.stdout)
for sha in ids:
 header=out.readline().decode().strip().split()
 if len(header)!=3:raise RuntimeError('Incomplete history scan')
 kind=header[1];size=int(header[2]);data=out.read(size);out.read(1)
 if kind=='commit':counts['gitCommits']+=1
 if kind=='blob':counts['gitBlobs']+=1;inspect(data,'git:'+sha[:12]+':'+names.get(sha,''))
git_config=(root/'.git/config').read_bytes()
if re.search(rb'https?://[^/\s:@]+:[^/\s@]+@',git_config) or re.search(rb'(?i)extraheader\s*=\s*.*(?:authorization|bearer|basic)',git_config):findings.append({'location':'.git/config','categories':['persisted_git_credential']})
env_paths=sorted({name for name in tracked if re.search(r'(^|/)\.(env($|\.)|dev\.vars)',name) and name!='.env.example'})
if env_paths:findings.append({'location':'tracked_environment_files','paths':env_paths,'categories':['environment_file_tracked']})
report={'counts':counts,'knownSecretComparisonAvailable':bool(known),'findings':findings,'limitations':['External clones, deleted remote refs, provider request logs and browser runtime console are outside this scan.','Pattern checks are not a proof that all possible credentials are absent.']}
path=root/'deliverables/security-secret-scan.json';path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False))
raise SystemExit(1 if findings else 0)

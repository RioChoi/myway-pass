from pathlib import Path
from zipfile import ZipFile
from lxml import etree
import hashlib,json
from docx import Document
root=Path(__file__).resolve().parent.parent
out=root/'.sites-runtime/documents';out.mkdir(parents=True,exist_ok=True)
refs=[Path('C:/Users/Choi/Desktop/(양식)+2026+AI+라이프+솔루션+챌린지+성과보고서/(Word양식)2026 AI 라이프 솔루션 챌린지 성과보고서.docx'),Path('C:/Users/Choi/Desktop/(양식)+2026+AI+라이프+솔루션+챌린지+참가신청서/(Word 양식)2026 AI 라이프 솔루션 챌린지 참가신청서.docx')]
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
records=[]
for i,p in enumerate(refs):
 d=Document(p)
 with ZipFile(p) as z:
  xml=etree.fromstring(z.read('word/document.xml'))
  record={'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'parts':{n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist()},'sections':[{'width':s.page_width,'height':s.page_height,'left':s.left_margin,'right':s.right_margin,'top':s.top_margin,'bottom':s.bottom_margin,'header':s.header_distance,'footer':s.footer_distance} for s in d.sections], 'tables':[]}
  for ti,t in enumerate(xml.xpath('/w:document/w:body/w:tbl',namespaces=ns)):
   cells=[]
   for ri,row in enumerate(t.findall('w:tr',ns)):
    for ci,c in enumerate(row.findall('w:tc',ns)):
     cells.append({'row':ri,'cell':ci,'text':'\n'.join(''.join(p.itertext()) for p in c.findall('w:p',ns)),'xml':etree.tostring(c,encoding='unicode')})
   record['tables'].append({'index':ti,'properties':etree.tostring(t.find('w:tblPr',ns),encoding='unicode'),'cells':cells})
  record['fields']=xml.xpath('//w:instrText/text()',namespaces=ns)
  record['controls']=xml.xpath('//w:sdtPr/w:tag/@w:val',namespaces=ns)
 records.append(record)
 (out/f'form-{i}-evidence.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
lines=['# Official template execution contract','Retained DOCX sources remain byte-for-byte unchanged. Source typography, tables and page geometry are authoritative.','']
for i,r in enumerate(records):
 lines += [f'## Reference {i}',f"Path: {r['path']}",f"SHA256: {r['sha256']}",f"Section count: {len(r['sections'])}",f"Page geometry and every cell/run/table property: form-{i}-evidence.json",f"All package part inventories are preserved in form-{i}-evidence.json.",f"Render: reference-{'report' if i==0 else 'application'}; page count recorded after successful render."]
lines += ['## Editable slots','Report: word/document.xml body table[1] rows[2..8], second cell. Retain the first paragraph/run properties, replacing only its text contents; additional source runs may be removed only in these seven content slots. Preserve title, row labels, table properties and all other parts.','Report summary maximum 3 rendered lines; final goal maximum 2 rendered lines; report body maximum 2 pages. Content is shortened to fit, without shrinking typography.','Report body table[2] is the appended application and is preserve-only. The separate application is copied unchanged, with personal details, date, consent and signature intentionally blank pending user entry.','No inferred name, affiliation, birth date, phone, agreement or signature. Idea number was absent from the provided candidate list and must remain marked for confirmation.','## Content coverage','All unique cells, text nodes, styles and fields are inventoried in the JSON evidence. No content controls or fields are modified.','## Fidelity gates','Only word/document.xml may change in the report. All package parts in the separate application must be identical. Compare section/table properties and all preserve-only parts. Inspect every original and output page after rendering.']
(out/'artifact.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps([{'path':r['path'],'sections':len(r['sections']),'tables':len(r['tables']),'fields':r['fields'],'controls':r['controls']} for r in records],ensure_ascii=False))

from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from copy import deepcopy
import hashlib,json,shutil
root=Path(__file__).resolve().parent.parent
contract=root/'.sites-runtime/documents'
evidence=json.loads((contract/'form-0-evidence.json').read_text(encoding='utf8'))
source=Path(evidence['path']);assert hashlib.sha256(source.read_bytes()).hexdigest()==evidence['sha256']
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};W='{'+ns['w']+'}'
contents={
1:['내 방식 QR 기능 요구 기반 접근성 화면 적응 기술'],
2:['내 방식 QR 범용 접근성 프로필 패스','아이디어 번호는 제공된 후보작 목록에 미표기되어 확인 필요'],
3:['QR·연결번호로 접근성 기능을 병원·카페에 재사용한다.','Jev로 기능을 추천하고 OpenAI로 구성·안내를 생성한다.','검증된 화면 틀과 오류 시 대체 화면으로 업무를 이어간다.'],
4:['개인정보 없이 접근성 프로필을 여러 업무에 재사용한다.','사용자가 직접 확인하는 병원·카페 MVP를 구현한다.'],
5:['ㅇ Capacitor Android 앱과 태블릿 웹, 공통 서버 구현','- 글씨·버튼 크기, 대비, 쉬운 안내, 읽기 속도, 터치 보정 설정','- Jev 기능 추천의 확인·수정, QR·일회용 번호 전달 지원','ㅇ 실제 API 및 자동 검사 수행','- OpenAI 병원·카페 구성 생성과 필수 동작 검증 통과','- 프로필·거래 검증, AI 오류 대체, 연결·초기화 검사 통과','- 완료 시 공급업체 중립의 가상 업무 JSON·인쇄 화면 제공'],
6:['ㅇ Jev가 연속 터치 어려움을 놓친 사례를 확인해 질문을 보정했다.','ㅇ AI 출력은 동작 집합·문구를 검증하고 실패 시 기본 틀로 전환한다.','ㅇ 실제 기기의 카메라·음성·화면 배치와 이용자 효과는 추가 검증한다.'],
7:['ㅇ 반복 설정 부담과 도움 요청 감소를 기대하며 효과는 실측하지 않았다.','ㅇ 실제 이용자 실험으로 기본·규칙·AI 화면의 시간·오류·도움을 비교한다.','ㅇ 이름·진단명 없는 기능 프로필을 다른 분야로 확장할 기반을 마련했다.'],
}
with ZipFile(source) as z:
 xml=etree.fromstring(z.read('word/document.xml'));table=xml.xpath('/w:document/w:body/w:tbl',namespaces=ns)[0]
 rows=table.findall('w:tr',ns);prototype=deepcopy(rows[5].findall('w:tc',ns)[1].find('w:p',ns))
 for ri,lines in contents.items():
  cell=rows[ri].findall('w:tc',ns)[1]
  for child in list(cell):
   if child.tag!=W+'tcPr':cell.remove(child)
  for line in lines:
   p=deepcopy(prototype)
   for child in list(p):
    if child.tag!=W+'pPr':p.remove(child)
   r=etree.SubElement(p,W+'r');t=etree.SubElement(r,W+'t');t.text=line;p.append(r) if r.getparent() is None else None
   cell.append(p)
 output=root/'deliverables/성과보고서_검증현황반영_초안.docx'
 with ZipFile(output,'w') as dest:
  for item in z.infolist():dest.writestr(deepcopy(item),etree.tostring(xml,xml_declaration=True,encoding='UTF-8',standalone=True) if item.filename=='word/document.xml' else z.read(item.filename))
 with ZipFile(output) as final:
  assert set(final.namelist())==set(z.namelist())
  assert all(final.read(n)==z.read(n) for n in z.namelist() if n!='word/document.xml')
 assert hashlib.sha256(source.read_bytes()).hexdigest()==evidence['sha256']
application=json.loads((contract/'form-1-evidence.json').read_text(encoding='utf8'))
shutil.copyfile(application['path'],root/'deliverables/참가신청서_인적사항기입용.docx')
assert hashlib.sha256((root/'deliverables/참가신청서_인적사항기입용.docx').read_bytes()).hexdigest()==application['sha256']
with (contract/'artifact.md').open('a',encoding='utf8') as f:f.write('\nOriginal render: report 2 pages (one report + one appended application), standalone application 1 page. Replaced slots reuse the report development-body paragraph, removing placeholder blue italic underlined instruction formatting. All other package parts are byte-identical.\n')
print('보고서 초안과 인적사항 기입용 신청서 생성. 원본 및 보존 대상 패키지 검증 통과.')

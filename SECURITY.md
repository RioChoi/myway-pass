# 보안 안내

- API 키는 서버 환경 변수에만 설정하세요. 실제 키를 이슈·PR·채팅에 붙이지 마세요.
- `.env.example`에는 빈 값만 유지합니다. `.env.local`, `.dev.vars`, DB, 서명키, APK는 커밋하지 않습니다.
- `.gitignore`는 이미 추적된 파일이나 이전 커밋의 비밀정보를 제거하지 않습니다. 유출 시 즉시 키를 폐기·재발급하고 이력도 정리해야 합니다.
- 새 커밋 전에 `python scripts/security-audit.py`를 실행하고 빌드 후 `node scripts/check-secrets.mjs`를 실행하세요. Python 검사 보고서는 값 대신 위치만 기록합니다.
- 서버에 유료 AI 키를 설정하면 호출 비용이 발생할 수 있습니다. 공개 운영 전 인증·게이트웨이와 제공사 청구 제한을 적용하세요.
- 남은 의존성 취약점 및 상용 라이선스 검토 범위는 `docs/security-audit-2026-10-22.md`를 확인하세요.

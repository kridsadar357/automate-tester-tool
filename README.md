# automate-tester-tool

เครื่องมือเทส API แบบ declarative — เขียน "suite" เป็นไฟล์ JSON แล้วรันยิงจริง ตรวจ
`status` / `json` (subset) / `headers` / เวลา และ **แชร์ตัวแปรข้ามเทสต์** (เช่น token จาก login).

สร้างโดย Riki Agent IDE 🤖

## ใช้งาน
```bash
bun run src/cli.ts suites/example.json     # หรือ: bun run example
bun test                                   # unit/integration tests (offline)
```

## รูปแบบ suite
```json
{
  "name": "ชื่อชุดทดสอบ",
  "baseUrl": "https://api.example.com",
  "headers": { "accept": "application/json" },
  "variables": { "postId": 1 },
  "tests": [
    {
      "name": "ดึงโพสต์",
      "method": "GET",
      "path": "/posts/{{postId}}",
      "expect": { "status": 200, "json": { "id": 1 }, "maxMs": 8000 },
      "save": { "uid": "json.userId" }
    },
    {
      "name": "สร้างโพสต์ (ใช้ตัวแปรที่ save ไว้)",
      "method": "POST",
      "path": "/posts",
      "body": { "title": "hi", "userId": "{{uid}}" },
      "expect": { "status": 201, "json": { "title": "hi" } }
    }
  ]
}
```

### ฟิลด์
- **method** (default GET), **url** (absolute) หรือ **path** (ต่อท้าย `baseUrl`)
- **headers / query / body** — interpolate `{{ตัวแปร}}` ได้ทุกที่
- **expect**: `status`, `json` (เช็คแบบ subset), `bodyContains`, `headers`, `maxMs`
- **save**: ดึงค่าจาก response (`status` / `text` / `json.x.y` / `headers.x`) เก็บเป็นตัวแปรให้เทสต์ถัดไป

exit code = 0 ถ้าผ่านหมด, 1 ถ้ามี fail (เหมาะกับ CI)

## โครงสร้าง
```
src/
  cli.ts          # entry: อ่าน suite → รัน → รายงาน → exit code
  runner.ts       # core: ยิง request + assert + chain ตัวแปร
  assert.ts       # deepContains (json subset)
  interpolate.ts  # {{var}} + dotted path
  report.ts       # console report
  types.ts
suites/example.json
tests/runner.test.ts
```

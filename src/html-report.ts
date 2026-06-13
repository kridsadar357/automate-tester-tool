import type { TestResult } from './types';

export function renderHtml(name: string, results: TestResult[]): string {
  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;

  const rows = results.map(r => {
    const status = r.ok ? 'Pass' : 'Fail';
    const duration = r.ms !== undefined ? `${r.ms.toFixed(2)}ms` : '-';
    const errors = r.errors && r.errors.length > 0 ? r.errors.join(', ') : '-';
    return `<tr><td>${r.name}</td><td>${status}</td><td>${r.status || ''}</td><td>${duration}</td><td>${errors}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<title>Test Report: ${name}</title>
<style>
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; }
th { background-color: #f2f2f2; }
.pass { color: green; }
.fail { color: red; }
</style>
</head>
<body>
<h1>Test Report: ${name}</h1>
<p>Passed: ${passed}, Failed: ${failed}</p>
<table>
<tr><th>Name</th><th>Status</th><th>Code</th><th>Duration</th><th>Errors</th></tr>
${rows}
</table>
</body>
</html>`;
}

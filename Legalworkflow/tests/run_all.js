const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = __dirname;
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') && f !== 'run_all.js');

let passed = 0;
let failed = 0;

console.log(`\n======================================================`);
console.log(`🏃 LEAGAL CRM TEST RUNNER: Executing ${files.length} test suites...`);
console.log(`======================================================`);

files.forEach(file => {
    console.log(`\n▶️ [EXECUTING SUITE]: ${file}`);
    console.log(`------------------------------------------------------`);
    try {
        // Execute the test script synchronously and pipe the output to the console
        execSync(`node "${path.join(testsDir, file)}"`, { encoding: 'utf8', stdio: 'inherit' });
        passed++;
    } catch (e) {
        console.error(`\n❌ ERROR: Suite [${file}] failed execution.`);
        failed++;
    }
});

console.log(`\n======================================================`);
console.log(`🏁 GLOBAL TEST RUN COMPLETE`);
console.log(`✅ Passed Suites : ${passed}/${files.length}`);
if (failed > 0) {
    console.log(`❌ Failed Suites : ${failed}/${files.length}`);
    console.log(`======================================================\n`);
    process.exit(1); // Exit with error code if any test suite fails
} else {
    console.log(`🌟 PERFECT SCORE! All suites executed successfully.`);
    console.log(`======================================================\n`);
    process.exit(0);
}

#!/usr/bin/env node
/**
 * Intellicore-Harness — 팀 전용 AI IDE 하네스 설치 스크립트
 *
 * Kiro (.kiro/) 와 Claude (.claude/) 모두 지원
 *
 * Usage:
 *   node install.js <profile> [options]
 *
 *   node install.js cxnexus-backend                          # Kiro + Claude 모두 설치
 *   node install.js cxnexus-backend --cli kiro               # Kiro만
 *   node install.js cxnexus-backend --cli claude             # Claude만
 *   node install.js cxnexus-backend --target /path/to/project
 *   node install.js --list                                   # 프로필 목록
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const PROFILES = JSON.parse(fs.readFileSync(path.join(ROOT, 'profiles', 'profiles.json'), 'utf-8')).profiles;

// ── Helpers ──

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) { count += copyDir(s, d); }
    else { fs.copyFileSync(s, d); count++; }
  }
  return count;
}

function parseArgs(argv) {
  const args = { profile: null, target: process.cwd(), cli: 'both' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--target' && argv[i + 1]) { args.target = path.resolve(argv[++i]); }
    else if (argv[i] === '--cli' && argv[i + 1]) { args.cli = argv[++i]; }
    else if (!argv[i].startsWith('-')) { args.profile = argv[i]; }
  }
  return args;
}

// ── Kiro 설치 ──

function installKiro(profile, profileDef, targetRoot) {
  const kiroDir = path.join(targetRoot, '.kiro');
  let count = 0;

  // rules — 항상 적용 (always-on)
  for (const ruleDir of profileDef.rules) {
    count += copyDir(path.join(ROOT, 'rules', ruleDir), path.join(kiroDir, 'rules'));
  }

  // skills — 필요 시 활성화 (on-demand)
  for (const skillDir of (profileDef.skills || [])) {
    count += copyDir(path.join(ROOT, 'skills', skillDir), path.join(kiroDir, 'skills'));
  }

  // agents 복사
  count += copyDir(path.join(ROOT, 'agents'), path.join(kiroDir, 'agents'));

  // settings 복사
  count += copyDir(path.join(ROOT, 'settings'), path.join(kiroDir, 'settings'));

  return count;
}

// ── Claude 설치 ──

function addFrontmatter(content, paths) {
  // 기존 frontmatter 제거 후 paths frontmatter 추가
  const stripped = content.replace(/^---\n[\s\S]*?\n---\n*/, '').trimStart();
  return `---\npaths:\n${paths.map(p => `  - "${p}"`).join('\n')}\n---\n\n${stripped}`;
}

function installClaude(profile, profileDef, targetRoot) {
  const claudeDir = path.join(targetRoot, '.claude');
  const rulesDir = path.join(claudeDir, 'rules');
  const skillsDir = path.join(claudeDir, 'skills');
  let count = 0;

  // ── rules → .claude/rules/*.md (플랫 구조) ──
  const claudePaths = profileDef.claudePaths || {};
  fs.mkdirSync(rulesDir, { recursive: true });
  for (const ruleDir of profileDef.rules) {
    const srcDir = path.join(ROOT, 'rules', ruleDir);
    if (!fs.existsSync(srcDir)) continue;
    const paths = claudePaths.rules?.[ruleDir];
    for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.md')).sort()) {
      let content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      if (paths) content = addFrontmatter(content, paths);
      fs.writeFileSync(path.join(rulesDir, file), content);
      count++;
    }
  }

  // ── skills → .claude/skills/*.md (플랫 구조, paths 조건부 로딩) ──
  const skillPaths = claudePaths.skills || {};
  fs.mkdirSync(skillsDir, { recursive: true });
  for (const skillDir of (profileDef.skills || [])) {
    const srcDir = path.join(ROOT, 'skills', skillDir);
    if (!fs.existsSync(srcDir)) continue;
    for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.md')).sort()) {
      const key = `${skillDir}/${file}`;
      const paths = skillPaths[key];
      if (!paths) continue; // paths 매핑 없으면 스킵 (불필요한 컨텍스트 방지)
      let content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      content = addFrontmatter(content, paths);
      fs.writeFileSync(path.join(skillsDir, file), content);
      count++;
    }
  }

  // Claude settings
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    source: 'intellicore-harness',
    profile,
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    model: 'sonnet',
    maxThinkingTokens: 10000
  }, null, 2));
  count++;

  return count;
}

// ── Commands ──

function install(args) {
  const { profile, target, cli } = args;
  if (!profile || !PROFILES[profile]) {
    console.log(`❌ 프로필 "${profile || ''}"을 찾을 수 없습니다.`);
    listProfiles();
    process.exit(1);
  }

  const def = PROFILES[profile];
  let total = 0;

  if (cli === 'both' || cli === 'kiro') {
    const n = installKiro(profile, def, target);
    total += n;
    console.log(`  ✅ Kiro (.kiro/) — ${n}개 파일`);
  }
  if (cli === 'both' || cli === 'claude') {
    const n = installClaude(profile, def, target);
    total += n;
    console.log(`  ✅ Claude (.claude/rules/) — ${n}개 파일`);
  }

  console.log(`\n📦 Intellicore-Harness 설치 완료`);
  console.log(`   프로필: ${profile} (${def.description})`);
  console.log(`   대상: ${target}`);
  console.log(`   총 ${total}개 파일\n`);
}

function listProfiles() {
  console.log('\n📋 사용 가능한 프로필:\n');
  for (const [name, def] of Object.entries(PROFILES)) {
    console.log(`  ${name.padEnd(20)} ${def.description}`);
  }
  console.log('');
}

// ── Main ──

const argv = process.argv.slice(2);

if (argv.includes('--list') || argv.includes('-l')) { listProfiles(); }
else if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
  console.log(`
Intellicore-Harness — 팀 전용 AI IDE 하네스

Usage:
  node install.js <profile>                        Kiro + Claude 모두 설치
  node install.js <profile> --cli kiro             Kiro만 설치
  node install.js <profile> --cli claude           Claude만 설치
  node install.js <profile> --target /path         지정 경로에 설치
  node install.js --list                           프로필 목록
  `);
} else {
  install(parseArgs(argv));
}

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
 *   node install.js --status                                 # 설치 상태
 *   node install.js --clean                                  # 제거
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

  // ── 기존 설치 정리 ──
  for (const d of ['rules', 'skills', 'steering'].map(p => path.join(kiroDir, p))) {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true });
  }

  // rules — 항상 적용 (always-on)
  for (const ruleDir of profileDef.rules) {
    count += copyDir(path.join(ROOT, 'rules', ruleDir), path.join(kiroDir, 'rules'));
  }

  // skills — 필요 시 활성화 (on-demand)
  for (const skillDir of (profileDef.skills || [])) {
    count += copyDir(path.join(ROOT, 'skills', skillDir), path.join(kiroDir, 'skills'));
  }

  // Kiro CLI hooks — bash 스크립트 + agent JSON
  const cliHooksDir = path.join(ROOT, 'hooks', 'kiro-cli');
  const destHooksDir = path.join(kiroDir, 'hooks', 'kiro-cli');
  count += copyDir(cliHooksDir, destHooksDir);

  // stop-reminder.sh 내 테스트 커맨드 치환
  const stopScript = path.join(destHooksDir, 'stop-reminder.sh');
  if (fs.existsSync(stopScript)) {
    let content = fs.readFileSync(stopScript, 'utf-8');
    content = content.replace(/\.\/gradlew test/g, profileDef.testCommand);
    fs.writeFileSync(stopScript, content);
  }

  // agent-hooks.json → .kiro/agents/default.json 으로 설치 + resources 주입
  const agentHooksFile = path.join(destHooksDir, 'agent-hooks.json');
  if (fs.existsSync(agentHooksFile)) {
    const agentsDir = path.join(kiroDir, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    const agentConfig = JSON.parse(fs.readFileSync(agentHooksFile, 'utf-8'));
    // rules/*.md, skills/*.md를 resources로 등록
    const resources = [];
    for (const sub of ['rules', 'skills']) {
      const dir = path.join(kiroDir, sub);
      if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
          resources.push(`file://${sub}/${f}`);
        }
      }
    }
    if (resources.length) agentConfig.resources = resources;
    fs.writeFileSync(path.join(agentsDir, 'default.json'), JSON.stringify(agentConfig, null, 2));
    count++;
  }

  // agents (.md) 복사
  count += copyDir(path.join(ROOT, 'agents'), path.join(kiroDir, 'agents'));

  // settings 복사
  count += copyDir(path.join(ROOT, 'settings'), path.join(kiroDir, 'settings'));

  // 매니페스트 기록
  fs.writeFileSync(path.join(kiroDir, '.harness-manifest.json'), JSON.stringify({
    source: 'intellicore-harness',
    profile,
    version: '1.0.0',
    installedAt: new Date().toISOString()
  }, null, 2));

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

  // ── 기존 설치 정리 ──
  for (const d of [rulesDir, skillsDir]) {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true });
  }

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

  // ── Claude hooks 머지 ──
  const hooksFile = path.join(ROOT, 'hooks', 'claude', 'hooks.json');
  let hooksConfig = {};
  if (fs.existsSync(hooksFile)) {
    hooksConfig = JSON.parse(fs.readFileSync(hooksFile, 'utf-8'));

    const reviewMap = {
      'kiro-java': '방금 작성된 파일을 간단히 점검하세요: 1) System.out.println 대신 @Slf4j log 사용 여부 2) Entity에 @Setter 사용 금지 3) RuntimeException 직접 throw 대신 BusinessException 사용 4) TODO/FIXME 코멘트. 문제가 있을 때만 보고하세요.',
      'kiro-ts': '방금 작성된 파일을 간단히 점검하세요: 1) console.log 대신 logger 사용 여부 2) any 타입 사용 금지 3) 미사용 import 4) TODO/FIXME 코멘트. 문제가 있을 때만 보고하세요.',
      'kiro-python': '방금 작성된 파일을 간단히 점검하세요: 1) print() 대신 logging 사용 여부 2) bare except 금지 3) 타입 힌트 누락 4) TODO/FIXME 코멘트. 문제가 있을 때만 보고하세요.'
    };
    const review = reviewMap[profileDef.hooks];
    if (review && hooksConfig.hooks?.PostToolUse?.[0]?.hooks?.[0]) {
      hooksConfig.hooks.PostToolUse[0].hooks[0].prompt = review;
    }

    const diagLangMap = { 'kiro-java': 'Java', 'kiro-ts': 'TypeScript', 'kiro-python': 'Python' };
    const diagLang = diagLangMap[profileDef.hooks];
    if (diagLang && hooksConfig.hooks?.PostToolUse?.[0]?.hooks?.[1]) {
      hooksConfig.hooks.PostToolUse[0].hooks[1].prompt =
        `방금 수정된 ${diagLang} 파일에 컴파일 에러나 타입 에러가 없는지 확인하세요. 문제가 있을 때만 보고하세요.`;
    }

    // Stop hooks — 테스트 커맨드 치환
    const stopHooks = hooksConfig.hooks?.Stop?.[0]?.hooks;
    if (stopHooks) {
      for (const hook of stopHooks) {
        if (hook.prompt && hook.prompt.includes('./gradlew test')) {
          hook.prompt = hook.prompt.replace(/\.\/gradlew test/g, profileDef.testCommand);
        }
      }
    }
  }

  // Claude settings (hooks 포함)
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    source: 'intellicore-harness',
    profile,
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    ...hooksConfig
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

function showStatus(target) {
  for (const [ide, file] of [['Kiro', '.kiro/.harness-manifest.json'], ['Claude', '.claude/settings.json']]) {
    const fp = path.join(target, file);
    if (fs.existsSync(fp)) {
      const m = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      console.log(`  ✅ ${ide}: ${m.profile} (${m.installedAt})`);
    } else {
      console.log(`  ❌ ${ide}: 미설치`);
    }
  }
}

function clean(target) {
  let removed = 0;
  // Kiro
  const manifest = path.join(target, '.kiro', '.harness-manifest.json');
  if (fs.existsSync(manifest)) {
    // steering, hooks만 제거 (settings/lsp.json은 유지)
    for (const dir of ['steering', 'hooks']) {
      const d = path.join(target, '.kiro', dir);
      if (fs.existsSync(d)) {
        for (const f of fs.readdirSync(d)) { fs.unlinkSync(path.join(d, f)); removed++; }
      }
    }
    fs.unlinkSync(manifest);
    removed++;
  }
  // Claude
  const claudeMd = path.join(target, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) { fs.unlinkSync(claudeMd); removed++; }
  const claudeRules = path.join(target, '.claude', 'rules');
  if (fs.existsSync(claudeRules)) { fs.rmSync(claudeRules, { recursive: true }); removed++; }
  const claudeSettings = path.join(target, '.claude', 'settings.json');
  if (fs.existsSync(claudeSettings)) { fs.unlinkSync(claudeSettings); removed++; }

  console.log(removed > 0 ? `\n🗑️  제거 완료 (${removed}개)\n` : '\n❌ 설치된 하네스 없음\n');
}

// ── Main ──

const argv = process.argv.slice(2);

if (argv.includes('--list') || argv.includes('-l')) { listProfiles(); }
else if (argv.includes('--status')) { showStatus(parseArgs(argv).target); }
else if (argv.includes('--clean')) { clean(parseArgs(argv).target); }
else if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
  console.log(`
Intellicore-Harness — 팀 전용 AI IDE 하네스

Usage:
  node install.js <profile>                        Kiro + Claude 모두 설치
  node install.js <profile> --cli kiro             Kiro만 설치
  node install.js <profile> --cli claude           Claude만 설치
  node install.js <profile> --target /path         지정 경로에 설치
  node install.js --list                           프로필 목록
  node install.js --status                         설치 상태 확인
  node install.js --clean                          하네스 제거
  `);
} else {
  install(parseArgs(argv));
}

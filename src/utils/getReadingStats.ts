const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const WORD_RE = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g;

function stripMarkup(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_~|[\](){}:;.,!?，。！？、]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getReadingStats(body = "") {
  const text = stripMarkup(body);
  const cjkCount = text.match(CJK_RE)?.length ?? 0;
  const wordCount = text.match(WORD_RE)?.length ?? 0;
  const equivalentWords = wordCount + cjkCount / 1.7;
  const minutes = Math.max(1, Math.ceil(equivalentWords / 220));

  return {
    cjkCount,
    wordCount,
    minutes,
    label: `约 ${minutes} 分钟阅读`,
  };
}

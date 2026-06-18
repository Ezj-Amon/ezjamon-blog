---
title: time-calculator_时间计算器
pubDatetime: 2026-06-18T10:06:00.000Z
scheduled: false
description: 连续时间计算器
featured: true
draft: false
category: 前端开发
subcategory: 编程
tags:
  - html
  - 时间
hideEditPost: false
timezone: Asia/Shanghai
---
### 时间计算器

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>时间计算器</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f6fb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #1f2937;
    }

    .calculator {
      width: 420px;
      background: #ffffff;
      border-radius: 22px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    }

    .title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }

    .screen {
      background: #111827;
      color: #ffffff;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 18px;
    }

    .label {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 6px;
    }

    .result {
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 1px;
      word-break: break-all;
    }

    .pending {
      margin-top: 10px;
      font-size: 14px;
      color: #d1d5db;
      min-height: 20px;
    }

    .input-area {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }

    .time-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .time-field span {
      font-size: 13px;
      color: #6b7280;
    }

    .time-field input {
      width: 100%;
      height: 46px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 0 12px;
      font-size: 18px;
      outline: none;
      text-align: center;
    }

    .time-field input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .preview {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 14px;
      font-size: 14px;
      color: #4b5563;
    }

    .buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    button {
      height: 48px;
      border: none;
      border-radius: 14px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      background: #e5e7eb;
      color: #111827;
      transition: 0.15s;
    }

    button:hover {
      filter: brightness(0.96);
    }

    button:active {
      transform: scale(0.98);
    }

    .operator {
      background: #2563eb;
      color: #ffffff;
    }

    .equals {
      background: #16a34a;
      color: #ffffff;
    }

    .danger {
      background: #ef4444;
      color: #ffffff;
    }

    .secondary {
      background: #f59e0b;
      color: #ffffff;
    }

    .history {
      margin-top: 18px;
      border-top: 1px solid #e5e7eb;
      padding-top: 14px;
      max-height: 140px;
      overflow-y: auto;
      font-size: 14px;
      color: #4b5563;
      line-height: 1.7;
    }

    .history-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }

    .hint {
      margin-top: 12px;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="calculator">
    <div class="title">时间计算器</div>

    <div class="screen">
      <div class="label">当前结果</div>
      <div id="result" class="result">0:00:00</div>
      <div id="pending" class="pending">等待输入时间</div>
    </div>

    <div class="input-area">
      <label class="time-field">
        <span>小时</span>
        <input id="hours" type="number" min="0" step="1" placeholder="0" />
      </label>

      <label class="time-field">
        <span>分钟</span>
        <input id="minutes" type="number" min="0" step="1" placeholder="0" />
      </label>

      <label class="time-field">
        <span>秒</span>
        <input id="seconds" type="number" min="0" step="1" placeholder="0" />
      </label>
    </div>

    <div id="preview" class="preview">当前输入：0:00:00</div>

    <div class="buttons">
      <button class="danger" onclick="clearAll()">AC</button>
      <button class="secondary" onclick="clearInput()">CE</button>
      <button onclick="fillNow()">结果填入</button>
      <button onclick="backspaceInput()">⌫</button>

      <button class="operator" onclick="pressOperator('+')">+</button>
      <button class="operator" onclick="pressOperator('-')">−</button>
      <button class="equals" onclick="pressEquals()">=</button>
      <button onclick="copyResult()">复制</button>
    </div>

    <div class="history">
      <div class="history-title">计算记录</div>
      <div id="historyList">暂无记录</div>
    </div>

    <div class="hint">
      用法示例：输入 1小时30分，点「+」；再输入 45分，点「-」；再输入 20分30秒，点「=」。
      这个计算器按普通计算器逻辑连续执行，没有乘除优先级。
    </div>
  </div>

  <script>
    let totalSeconds = 0;
    let pendingOperator = null;
    let hasStarted = false;
    let history = [];

    const hoursInput = document.getElementById("hours");
    const minutesInput = document.getElementById("minutes");
    const secondsInput = document.getElementById("seconds");

    const resultEl = document.getElementById("result");
    const pendingEl = document.getElementById("pending");
    const previewEl = document.getElementById("preview");
    const historyListEl = document.getElementById("historyList");

    function toInteger(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.trunc(num);
    }

    function getInputSeconds() {
      const h = Math.max(0, toInteger(hoursInput.value));
      const m = Math.max(0, toInteger(minutesInput.value));
      const s = Math.max(0, toInteger(secondsInput.value));

      return h * 3600 + m * 60 + s;
    }

    function isInputEmpty() {
      return (
        hoursInput.value === "" &&
        minutesInput.value === "" &&
        secondsInput.value === ""
      );
    }

    function formatTime(total) {
      const sign = total < 0 ? "-" : "";
      const abs = Math.abs(total);

      const h = Math.floor(abs / 3600);
      const m = Math.floor((abs % 3600) / 60);
      const s = abs % 60;

      return `${sign}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function updateDisplay() {
      resultEl.textContent = formatTime(totalSeconds);
      previewEl.textContent = `当前输入：${formatTime(getInputSeconds())}`;

      if (!hasStarted) {
        pendingEl.textContent = "等待输入时间";
      } else if (pendingOperator) {
        pendingEl.textContent = `当前结果 ${formatTime(totalSeconds)}，等待执行「${pendingOperator}」`;
      } else {
        pendingEl.textContent = "已得到结果，可以继续按 + / - 连续计算";
      }

      renderHistory();
    }

    function renderHistory() {
      if (history.length === 0) {
        historyListEl.textContent = "暂无记录";
        return;
      }

      historyListEl.innerHTML = history
        .slice(-8)
        .map(item => `<div>${item}</div>`)
        .join("");
    }

    function applyPendingOperation(inputSeconds) {
      if (!hasStarted) {
        totalSeconds = inputSeconds;
        hasStarted = true;
        history.push(`输入 ${formatTime(inputSeconds)}`);
        return;
      }

      if (pendingOperator === "+") {
        const before = totalSeconds;
        totalSeconds += inputSeconds;
        history.push(`${formatTime(before)} + ${formatTime(inputSeconds)} = ${formatTime(totalSeconds)}`);
      } else if (pendingOperator === "-") {
        const before = totalSeconds;
        totalSeconds -= inputSeconds;
        history.push(`${formatTime(before)} - ${formatTime(inputSeconds)} = ${formatTime(totalSeconds)}`);
      } else {
        totalSeconds = inputSeconds;
        history.push(`重新输入 ${formatTime(inputSeconds)}`);
      }
    }

    function pressOperator(operator) {
      const inputSeconds = getInputSeconds();

      if (!hasStarted) {
        applyPendingOperation(inputSeconds);
        clearInput(false);
      } else if (pendingOperator) {
        applyPendingOperation(inputSeconds);
        clearInput(false);
      } else {
        if (!isInputEmpty()) {
          totalSeconds = inputSeconds;
          history.push(`重新开始：${formatTime(inputSeconds)}`);
          clearInput(false);
        }
      }

      pendingOperator = operator;
      updateDisplay();
    }

    function pressEquals() {
      if (!hasStarted) {
        applyPendingOperation(getInputSeconds());
        clearInput(false);
        pendingOperator = null;
        updateDisplay();
        return;
      }

      if (!pendingOperator) {
        updateDisplay();
        return;
      }

      applyPendingOperation(getInputSeconds());
      clearInput(false);
      pendingOperator = null;
      updateDisplay();
    }

    function clearInput(shouldUpdate = true) {
      hoursInput.value = "";
      minutesInput.value = "";
      secondsInput.value = "";

      if (shouldUpdate) {
        updateDisplay();
      }
    }

    function clearAll() {
      totalSeconds = 0;
      pendingOperator = null;
      hasStarted = false;
      history = [];
      clearInput(false);
      updateDisplay();
    }

    function fillNow() {
      const abs = Math.abs(totalSeconds);

      hoursInput.value = Math.floor(abs / 3600);
      minutesInput.value = Math.floor((abs % 3600) / 60);
      secondsInput.value = abs % 60;

      updateDisplay();
    }

    function backspaceInput() {
      if (secondsInput.value !== "") {
        secondsInput.value = secondsInput.value.slice(0, -1);
      } else if (minutesInput.value !== "") {
        minutesInput.value = minutesInput.value.slice(0, -1);
      } else if (hoursInput.value !== "") {
        hoursInput.value = hoursInput.value.slice(0, -1);
      }

      updateDisplay();
    }

    function copyResult() {
      const text = formatTime(totalSeconds);

      navigator.clipboard
        .writeText(text)
        .then(() => {
          pendingEl.textContent = `已复制结果：${text}`;
        })
        .catch(() => {
          pendingEl.textContent = "复制失败，请手动复制结果";
        });
    }

    [hoursInput, minutesInput, secondsInput].forEach(input => {
      input.addEventListener("input", updateDisplay);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        pressEquals();
      }

      if (event.key === "Escape") {
        clearAll();
      }
    });

    updateDisplay();
  </script>
</body>
</html>
```


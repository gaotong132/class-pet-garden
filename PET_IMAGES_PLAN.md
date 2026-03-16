# 宠物等级图片生成操作指南

> 目标：为25种宠物 × 8个等级生成统一风格的图片
> 技术：SiliconFlow FLUX.1-dev
> 核心：每种宠物独立设计装饰，严格统一画风

---

## 一、设计理念

### 核心原则
- **一宠一设计**：每种宠物独立设计装饰，符合宠物特性
- **严格画风统一**：所有图片使用完全相同的风格描述词
- **装饰升级体现成长**：从简单到华丽，体现等级提升

### 画风规范（严格统一，不可更改）
```
STYLE = "flat cartoon illustration, kawaii chibi style, consistent character design,
cute friendly expression, big round sparkling eyes with white highlights,
soft rounded shapes, smooth clean outlines, no sharp edges,
bright saturated warm colors, soft shading, 2D vector art style,
children book illustration style, standing pose, front facing,
white background, masterpiece, best quality"

NEGATIVE = "3D, realistic, photograph, scary, dark, complex background,
busy background, text, watermark, signature, blurry, low quality,
different style, inconsistent design"
```

**关键：**
- 使用 `flat cartoon illustration` 确保扁平风格
- 使用 `consistent character design` 确保一致性
- 使用 `white background` 或简单背景，避免背景干扰
- 使用 `2D vector art style` 确保矢量感

---

## 二、宠物装饰设计

### 设计原则
1. **符合宠物特性**：猫用猫相关装饰，狗用狗相关装饰
2. **等级递进清晰**：Lv.1简单 → Lv.8华丽神圣
3. **装饰可见性**：一眼可见，不模糊
4. **风格统一性**：所有宠物使用相同画风描述

### 示例：小猫装饰设计

| 等级 | 装饰主题 | 具体元素 | 设计理念 |
|------|---------|---------|---------|
| Lv.1 | 婴儿期 | 粉色小蝴蝶结 | 最简装饰，突出可爱 |
| Lv.2 | 幼年期 | 铃铛项圈+毛线球 | 猫喜欢玩毛线 |
| Lv.3 | 成长期 | 星星猫耳发饰 | 猫耳元素+星星 |
| Lv.4 | 少年期 | 小鱼骨项链 | 猫爱吃鱼，鱼骨元素 |
| Lv.5 | 青年期 | 小皇冠+猫爪印记 | 开始展现王者气质 |
| Lv.6 | 成熟期 | 华丽皇冠+猫耳+小翅膀 | 猫耳+翅膀，飞行能力 |
| Lv.7 | 王者期 | 大翅膀+猫爪光环 | 强大气场 |
| Lv.8 | 传说期 | 神圣皇冠+大翅膀+漂浮+猫爪符号环绕 | 完全神圣化 |

### 示例：小狗装饰设计

| 等级 | 装饰主题 | 具体元素 | 设计理念 |
|------|---------|---------|---------|
| Lv.1 | 婴儿期 | 蓝色小领结 | 简单可爱 |
| Lv.2 | 幼年期 | 骨头项圈+小球 | 狗喜欢骨头和球 |
| Lv.3 | 成长期 | 星星狗牌 | 身份标识升级 |
| Lv.4 | 少年期 | 金色骨头项链 | 华丽版骨头元素 |
| Lv.5 | 青年期 | 小皇冠+狗爪印记 | 王者气质 |
| Lv.6 | 成熟期 | 华丽皇冠+狗耳+翅膀 | 忠诚天使形象 |
| Lv.7 | 王者期 | 大翅膀+狗爪光环 | 守护天使 |
| Lv.8 | 传说期 | 神圣皇冠+大翅膀+漂浮+忠诚符号 | 神圣守护 |

### 待设计宠物清单

**普通动物（18种）：**
- [x] cat - 小猫
- [x] dog - 小狗
- [ ] rabbit - 小兔
- [ ] hamster - 仓鼠
- [ ] bird - 小鸟
- [ ] fish - 小鱼
- [ ] turtle - 小龟
- [ ] frog - 青蛙
- [ ] duck - 小鸭
- [ ] penguin - 企鹅
- [ ] bear - 小熊
- [ ] fox - 小狐狸
- [ ] deer - 小鹿
- [ ] squirrel - 松鼠
- [ ] panda - 熊猫
- [ ] koala - 考拉
- [ ] hedgehog - 刺猬
- [ ] owl - 猫头鹰

**神兽（7种）：**
- [ ] dragon - 小龙
- [ ] phoenix - 凤凰
- [ ] unicorn - 独角兽
- [ ] kirin - 麒麟
- [ ] pegasus - 飞马
- [ ] nine_tailed_fox - 九尾狐
- [ ] qilin - 青龙

---

## 三、Prompt模板（严格统一）

### 基础结构
```
A cute [宠物主体描述], [等级装饰描述],
[严格统一风格词],
[背景描述],
masterpiece, best quality, 8k
```

### 风格词（所有宠物完全相同）
```
flat cartoon illustration, kawaii chibi style, consistent character design,
cute friendly expression, big round sparkling eyes with white highlights,
soft rounded shapes, smooth clean outlines, no sharp edges,
bright saturated warm colors, soft shading, 2D vector art style,
children book illustration style, standing pose, front facing
```

### 负面词（所有宠物完全相同）
```
3D, realistic, photograph, scary, dark, complex background,
busy background, text, watermark, signature, blurry, low quality,
different style, inconsistent design, ugly, deformed
```

### 背景词（根据等级）
| 等级 | 背景 |
|------|------|
| Lv.1-2 | simple soft gradient background, pastel colors |
| Lv.3-4 | soft nature background with bokeh effect |
| Lv.5-6 | golden light rays, soft glow background |
| Lv.7-8 | divine golden light, ethereal glow, cosmic stars |

### 完整Prompt示例（cat Lv.5）
```
A cute fluffy orange and white cat with big round eyes and pink nose,
wearing small golden crown with cat paw prints on head,
flat cartoon illustration, kawaii chibi style, consistent character design,
cute friendly expression, big round sparkling eyes with white highlights,
soft rounded shapes, smooth clean outlines, no sharp edges,
bright saturated warm colors, soft shading, 2D vector art style,
children book illustration style, standing pose, front facing,
golden light rays background, soft glow,
masterpiece, best quality, 8k
```

---

## 四、画风统一检查清单

生成每张图后检查：
- [ ] 是否扁平2D风格（非3D）
- [ ] 眼睛是否大而圆带高光
- [ ] 线条是否圆润无尖角
- [ ] 色彩是否明亮温暖
- [ ] 是否与已生成图片风格一致
- [ ] 背景是否简洁不喧宾夺主

**如果不一致，立即调整Prompt重新生成**

---

## 五、操作流程

### 1. 设计宠物装饰
为每种宠物设计8个等级的装饰（参考cat/dog示例）

### 2. 生成图片
```bash
python scripts/generate_pets.py --pet [宠物名] --all
```

### 3. 画风检查
- 视觉对比已生成的图片
- 确认风格统一
- 不统一则调整Prompt重新生成

### 4. 装饰审核
- 检查装饰是否清晰可见
- 检查是否符合设计要求
- 不通过则重新生成

### 5. 完成确认
8张图风格统一、装饰清晰后，标记完成

---

## 六、质量把控

### 画风统一策略
1. **使用完全相同的风格词**（复制粘贴，不改动）
2. **先生成Lv.1和Lv.8作为基准**
3. **中间等级与基准对比**，确保一致
4. **发现问题立即调整**，不累积

### 常见问题处理
| 问题 | 原因 | 解决 |
|------|------|------|
| 画风不一致 | 风格词被修改 | 复制粘贴统一风格词 |
| 太写实 | 缺少风格词 | 添加`flat cartoon illustration` |
| 背景太复杂 | 背景描述过多 | 简化背景，使用`simple background` |
| 眼睛不够大 | 缺少眼睛描述 | 添加`big round sparkling eyes` |

---

## 七、下一步行动

1. **确认cat的8张图风格统一**
   - 对比Lv.1和Lv.8
   - 确认画风一致
   - 如有问题，调整Prompt重新生成

2. **设计dog的装饰**
   - 参考cat示例
   - 设计8个等级的装饰
   - 生成并检查

3. **继续其他宠物**
   - 逐个设计装饰
   - 生成并检查画风
   - 确保与cat/dog风格统一

---

**关键：严格使用统一的风格词，确保所有宠物画风一致！**

import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { verifyTagOwnership, verifyStudentsOwnership } from '../middleware/ownership.js'

const router = Router()

// 预设颜色
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#78716c',
]

// 获取标签列表
router.get('/', authMiddleware, (req, res) => {
  const tags = db.prepare(`
    SELECT * FROM student_tags
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.userId)

  res.json({ tags })
})

// 添加标签
router.post('/', authMiddleware, (req, res) => {
  const { name, color } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '标签名称不能为空' })
  }

  // 检查是否重复
  const existing = db.prepare(`
    SELECT id FROM student_tags WHERE user_id = ? AND name = ?
  `).get(req.userId, name.trim())

  if (existing) {
    return res.status(400).json({ error: '标签名称已存在' })
  }

  const id = uuidv4()
  const tagColor = color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
  const now = Date.now()

  db.prepare(`
    INSERT INTO student_tags (id, user_id, name, color, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.userId, name.trim(), tagColor, now)

  res.json({
    id,
    name: name.trim(),
    color: tagColor,
    user_id: req.userId,
    created_at: now
  })
})

// 更新标签
router.put('/:id', authMiddleware, (req, res) => {
  const { name, color } = req.body
  const tagId = req.params.id

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权修改' })
  }

  // 检查名称是否重复
  if (name && name.trim() !== tag.name) {
    const existing = db.prepare(`
      SELECT id FROM student_tags
      WHERE user_id = ? AND name = ? AND id != ?
    `).get(req.userId, name.trim(), tagId)

    if (existing) {
      return res.status(400).json({ error: '标签名称已存在' })
    }
  }

  const newName = name?.trim() || tag.name
  const newColor = color || tag.color

  db.prepare(`
    UPDATE student_tags SET name = ?, color = ? WHERE id = ?
  `).run(newName, newColor, tagId)

  res.json({
    id: tagId,
    name: newName,
    color: newColor,
    user_id: req.userId,
    created_at: tag.created_at
  })
})

// 删除标签
router.delete('/:id', authMiddleware, (req, res) => {
  const tagId = req.params.id

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权删除' })
  }

  db.prepare('DELETE FROM student_tag_relations WHERE tag_id = ?').run(tagId)
  db.prepare('DELETE FROM student_tags WHERE id = ?').run(tagId)

  res.json({ success: true })
})

// 获取预设颜色
router.get('/colors', (req, res) => {
  res.json({ colors: PRESET_COLORS })
})

// 获取学生的标签
router.get('/student/:studentId', authMiddleware, (req, res) => {
  const { studentId } = req.params

  const tags = db.prepare(`
    SELECT st.* FROM student_tags st
    JOIN student_tag_relations str ON st.id = str.tag_id
    WHERE str.student_id = ? AND st.user_id = ?
    ORDER BY str.created_at DESC
  `).all(studentId, req.userId)

  res.json({ tags })
})

// 给学生添加标签
router.post('/student/:studentId', authMiddleware, (req, res) => {
  const { studentId } = req.params
  const { tagId } = req.body

  if (!tagId) {
    return res.status(400).json({ error: '缺少标签ID' })
  }

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权使用' })
  }

  const existing = db.prepare(`
    SELECT id FROM student_tag_relations
    WHERE student_id = ? AND tag_id = ?
  `).get(studentId, tagId)

  if (existing) {
    return res.status(400).json({ error: '该学生已有此标签' })
  }

  const id = uuidv4()
  const now = Date.now()

  db.prepare(`
    INSERT INTO student_tag_relations (id, student_id, tag_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, studentId, tagId, now)

  res.json({ success: true, tag })
})

// 移除学生的标签
router.delete('/student/:studentId/:tagId', authMiddleware, (req, res) => {
  const { studentId, tagId } = req.params

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权操作' })
  }

  db.prepare(`
    DELETE FROM student_tag_relations
    WHERE student_id = ? AND tag_id = ?
  `).run(studentId, tagId)

  res.json({ success: true })
})

// 批量给学生添加标签
router.post('/batch-add', authMiddleware, (req, res) => {
  const { studentIds, tagId } = req.body

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: '缺少学生ID列表' })
  }

  if (!tagId) {
    return res.status(400).json({ error: '缺少标签ID' })
  }

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权使用' })
  }

  const now = Date.now()
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO student_tag_relations (id, student_id, tag_id, created_at)
    VALUES (?, ?, ?, ?)
  `)

  const insertMany = db.transaction((ids) => {
    for (const studentId of ids) {
      insertStmt.run(uuidv4(), studentId, tagId, now)
    }
  })

  insertMany(studentIds)

  res.json({ success: true, count: studentIds.length })
})

// 批量移除学生的标签
router.post('/batch-remove', authMiddleware, (req, res) => {
  const { studentIds, tagId } = req.body

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: '缺少学生ID列表' })
  }

  if (!tagId) {
    return res.status(400).json({ error: '缺少标签ID' })
  }

  const tag = verifyTagOwnership(tagId, req.userId)
  if (!tag) {
    return res.status(404).json({ error: '标签不存在或无权操作' })
  }

  const deleteStmt = db.prepare(`
    DELETE FROM student_tag_relations
    WHERE student_id = ? AND tag_id = ?
  `)

  const deleteMany = db.transaction((ids) => {
    for (const studentId of ids) {
      deleteStmt.run(studentId, tagId)
    }
  })

  deleteMany(studentIds)

  res.json({ success: true, count: studentIds.length })
})

export default router
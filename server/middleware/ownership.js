/**
 * 资源所有权验证工具
 * 用于验证用户对班级、学生、规则等资源的访问权限
 */
import { db } from '../db.js'

/**
 * 验证班级所有权
 * @param {string} classId - 班级ID
 * @param {string} userId - 用户ID
 * @returns {object|null} 班级信息或null
 */
export function verifyClassOwnership(classId, userId) {
  return db.prepare(`
    SELECT * FROM classes WHERE id = ? AND user_id = ?
  `).get(classId, userId)
}

/**
 * 验证学生所有权（通过班级关联）
 * @param {string} studentId - 学生ID
 * @param {string} userId - 用户ID
 * @returns {object|null} 学生信息或null
 */
export function verifyStudentOwnership(studentId, userId) {
  return db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ? AND c.user_id = ?
  `).get(studentId, userId)
}

/**
 * 验证评价记录所有权
 * @param {string} recordId - 记录ID
 * @param {string} userId - 用户ID
 * @returns {object|null} 记录信息或null
 */
export function verifyRecordOwnership(recordId, userId) {
  return db.prepare(`
    SELECT er.* FROM evaluation_records er
    JOIN classes c ON er.class_id = c.id
    WHERE er.id = ? AND c.user_id = ?
  `).get(recordId, userId)
}

/**
 * 验证规则所有权
 * @param {string} ruleId - 规则ID
 * @param {string} userId - 用户ID
 * @returns {object|null} 规则信息或null
 */
export function verifyRuleOwnership(ruleId, userId) {
  return db.prepare(`
    SELECT * FROM evaluation_rules WHERE id = ? AND user_id = ?
  `).get(ruleId, userId)
}

/**
 * 验证标签所有权
 * @param {string} tagId - 标签ID
 * @param {string} userId - 用户ID
 * @returns {object|null} 标签信息或null
 */
export function verifyTagOwnership(tagId, userId) {
  return db.prepare(`
    SELECT * FROM student_tags WHERE id = ? AND user_id = ?
  `).get(tagId, userId)
}

/**
 * 批量验证学生所有权
 * @param {string[]} studentIds - 学生ID数组
 * @param {string} userId - 用户ID
 * @returns {object} { valid: boolean, students: object[] }
 */
export function verifyStudentsOwnership(studentIds, userId) {
  if (!studentIds || studentIds.length === 0) {
    return { valid: false, students: [] }
  }

  const placeholders = studentIds.map(() => '?').join(',')
  const students = db.prepare(`
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id IN (${placeholders}) AND c.user_id = ?
  `).all(...studentIds, userId)

  return {
    valid: students.length === studentIds.length,
    students
  }
}

/**
 * 中间件工厂：验证班级访问权限
 * 从 req.params.classId 或 req.body.classId 获取班级ID
 */
export function requireClassOwnership(req, res, next) {
  const classId = req.params.classId || req.body.classId
  
  if (!classId) {
    return res.status(400).json({ error: '缺少班级ID' })
  }

  const cls = verifyClassOwnership(classId, req.userId)
  if (!cls) {
    return res.status(403).json({ error: '班级不存在或无权访问' })
  }

  req.classInfo = cls
  next()
}

/**
 * 中间件工厂：验证学生访问权限
 * 从 req.params.id 获取学生ID
 */
export function requireStudentOwnership(req, res, next) {
  const studentId = req.params.id
  
  if (!studentId) {
    return res.status(400).json({ error: '缺少学生ID' })
  }

  const student = verifyStudentOwnership(studentId, req.userId)
  if (!student) {
    return res.status(404).json({ error: '学生不存在或无权访问' })
  }

  req.studentInfo = student
  next()
}
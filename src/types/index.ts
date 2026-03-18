export interface Class {
  id: string
  name: string
  created_at: number
}

export interface Student {
  id: string
  class_id: string
  name: string
  student_no: string | null
  total_points: number
  pet_type: string | null
  pet_level: number
  pet_exp: number
}

export interface Rule {
  id: string
  name: string
  points: number
  category: string
  is_custom?: boolean
}

export interface EvaluationRecord {
  id: string
  class_id: string
  student_id: string
  student_name?: string
  points: number
  reason: string
  category: string
  timestamp: number
}

export interface EvaluationResult {
  id: string
  timestamp: number
  petLevel?: number
  petExp?: number
  levelUp?: boolean
  levelDown?: boolean
  graduated?: boolean
}

import fs from 'fs'
import path from 'path'

const number = (input) => {
  const digits = input.replace(/\D/g, "")
  return digits.startsWith("0") ? "62" + digits.slice(1) : digits
}

export default number
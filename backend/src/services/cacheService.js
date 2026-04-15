const { redisClient } = require('../config/redis');

class CacheService {
  static async cacheExamQuestions(examId, questions, ttl = 3600) {
    await redisClient.setEx(`exam_q_${examId}`, ttl, JSON.stringify(questions));
  }

  static async getExamSession(attemptId) {
    const data = await redisClient.get(`exam_session_${attemptId}`);
    return data ? JSON.parse(data) : null;
  }

  static async saveAnswerBuffer(attemptId, questionId, answer) {
    await redisClient.hSet(`exam_answers_${attemptId}`, questionId, JSON.stringify(answer));
  }

  static async getAnswerBuffer(attemptId) {
    return await redisClient.hGetAll(`exam_answers_${attemptId}`);
  }

  static async flushAnswerBuffer(attemptId) {
    const keys = await this.getAnswerBuffer(attemptId);
    // Logic to move to DB (delegated to examService)
    await redisClient.del(`exam_answers_${attemptId}`);
    return keys;
  }
}

module.exports = CacheService;

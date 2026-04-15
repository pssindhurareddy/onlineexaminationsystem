const { ExamAttempt, Exam, Question, AttemptAnswer } = require('../models');
const CacheService = require('./cacheService');

class ExamService {
  static async startExam(examId, userId) {
    const exam = await Exam.findByPk(examId);
    if (!exam || exam.status !== 'active') throw new Error('Exam not available');
    
    // Create attempt
    const attempt = await ExamAttempt.create({
      exam_id: examId,
      user_id: userId,
      started_at: new Date(),
      status: 'in_progress'
    });

    return attempt;
  }

  static async saveAnswer(attemptId, questionId, answer) {
    await CacheService.saveAnswerBuffer(attemptId, questionId, answer);
  }

  static async submitExam(attemptId) {
    const attempt = await ExamAttempt.findByPk(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status !== 'in_progress') throw new Error('Exam already submitted');

    const bufferedAnswers = await CacheService.flushAnswerBuffer(attemptId);
    
    const answersToInsert = [];
    for (const [qId, ans] of Object.entries(bufferedAnswers)) {
      answersToInsert.push({
        attempt_id: attemptId,
        question_id: qId,
        selected_answer: JSON.parse(ans)
      });
    }

    if (answersToInsert.length > 0) {
      await AttemptAnswer.bulkCreate(answersToInsert);
    }

    attempt.status = 'submitted';
    attempt.submitted_at = new Date();
    attempt.time_taken_seconds = Math.floor((attempt.submitted_at - attempt.started_at) / 1000);
    await attempt.save();

    return attempt;
  }
}

module.exports = ExamService;

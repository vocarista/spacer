/**
 * SM-2 Algorithm utilities
 * Implements the SuperMemo 2 spaced repetition algorithm
 */

/**
 * Calculate next review parameters using SM-2 algorithm
 * @param {number} currentInterval - Current interval in days
 * @param {number} easinessFactor - Current easiness factor (EF)
 * @param {number} repetitionCount - Current repetition count
 * @param {number} qualityRating - Quality rating (0-5)
 * @returns {Object} Next review parameters
 */
function calculateNextReview(currentInterval, easinessFactor, repetitionCount, qualityRating) {
  let newInterval = currentInterval;
  let newEasinessFactor = easinessFactor;
  let newRepetitionCount = repetitionCount;

  // Calculate new easiness factor
  newEasinessFactor = easinessFactor + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
  
  // Ensure easiness factor stays within valid range
  if (newEasinessFactor < 1.3) {
    newEasinessFactor = 1.3;
  }

  // Calculate new interval and repetition count based on quality
  if (qualityRating >= 3) {
    // Correct response - increase interval
    newRepetitionCount = repetitionCount + 1;
    
    if (repetitionCount === 0) {
      newInterval = 1;
    } else if (repetitionCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * easinessFactor);
    }
  } else {
    // Incorrect response - reset to beginning
    newInterval = 1;
    newRepetitionCount = 0;
  }

  return {
    interval: newInterval,
    easinessFactor: newEasinessFactor,
    repetitionCount: newRepetitionCount
  };
}

/**
 * Calculate next review date
 * @param {Date} currentDate - Current review date
 * @param {number} intervalDays - Interval in days
 * @returns {Date} Next review date
 */
function calculateNextReviewDate(currentDate, intervalDays) {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

/**
 * Get quality rating description
 * @param {number} rating - Quality rating (0-5)
 * @returns {string} Description of the rating
 */
function getQualityRatingDescription(rating) {
  const descriptions = {
    0: 'Total blackout - complete failure to recall',
    1: 'Incorrect response, but the correct one seemed easy to recall',
    2: 'Incorrect response, but the correct one seemed hard to recall',
    3: 'Correct response, but required significant effort',
    4: 'Correct response, after some hesitation',
    5: 'Perfect response, without any hesitation'
  };
  
  return descriptions[rating] || 'Invalid rating';
}

/**
 * Validate quality rating
 * @param {number} rating - Quality rating to validate
 * @returns {boolean} True if rating is valid
 */
function validateQualityRating(rating) {
  return Number.isInteger(rating) && rating >= 0 && rating <= 5;
}

/**
 * Get recommended quality rating based on review time
 * @param {number} reviewTimeSeconds - Time taken to review in seconds
 * @param {number} difficulty - Subjective difficulty (1-5)
 * @returns {number} Recommended quality rating
 */
function getRecommendedQualityRating(reviewTimeSeconds, difficulty = 3) {
  // Base rating on review time and difficulty
  if (reviewTimeSeconds <= 10) {
    // Very fast recall - likely easy
    return Math.min(5, 4 + (6 - difficulty));
  } else if (reviewTimeSeconds <= 30) {
    // Fast recall
    return Math.min(4, 3 + (6 - difficulty));
  } else if (reviewTimeSeconds <= 60) {
    // Moderate recall
    return Math.min(3, 2 + (6 - difficulty));
  } else if (reviewTimeSeconds <= 120) {
    // Slow recall
    return Math.max(2, 1 + (6 - difficulty));
  } else {
    // Very slow recall
    return Math.max(0, (6 - difficulty));
  }
}

/**
 * Calculate learning efficiency metrics
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Efficiency metrics
 */
function calculateLearningEfficiency(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      averageQuality: 0,
      retentionRate: 0,
      averageInterval: 0,
      totalReviews: 0
    };
  }

  const totalReviews = reviews.length;
  const totalQuality = reviews.reduce((sum, review) => sum + review.quality_rating, 0);
  const averageQuality = totalQuality / totalReviews;
  
  // Retention rate (reviews with quality >= 3)
  const retainedReviews = reviews.filter(review => review.quality_rating >= 3).length;
  const retentionRate = (retainedReviews / totalReviews) * 100;
  
  // Average interval
  const intervals = reviews.map(review => review.new_interval || review.previous_interval || 1);
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

  return {
    averageQuality: Math.round(averageQuality * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
    averageInterval: Math.round(averageInterval * 100) / 100,
    totalReviews
  };
}

/**
 * Predict when a topic will be mastered
 * @param {number} currentEasinessFactor - Current EF
 * @param {number} currentInterval - Current interval
 * @param {number} targetInterval - Target interval for mastery (default: 365 days)
 * @returns {Object} Mastery prediction
 */
function predictMastery(currentEasinessFactor, currentInterval, targetInterval = 365) {
  if (currentEasinessFactor <= 1.3) {
    return {
      willMaster: false,
      estimatedReviews: Infinity,
      estimatedDays: Infinity,
      reason: 'Easiness factor too low for effective learning'
    };
  }

  let estimatedReviews = 0;
  let estimatedInterval = currentInterval;
  let estimatedDays = 0;

  // Simulate future reviews with perfect quality (rating 5)
  while (estimatedInterval < targetInterval && estimatedReviews < 100) {
    estimatedReviews++;
    const nextReview = calculateNextReview(
      estimatedInterval,
      currentEasinessFactor,
      estimatedReviews,
      5 // Perfect quality
    );
    
    estimatedInterval = nextReview.interval;
    estimatedDays += nextReview.interval;
  }

  return {
    willMaster: estimatedInterval >= targetInterval,
    estimatedReviews,
    estimatedDays,
    currentInterval,
    targetInterval
  };
}

/**
 * Get optimal review schedule for multiple topics
 * @param {Array} topics - Array of topics with next review dates
 * @param {number} maxReviewsPerDay - Maximum reviews per day (default: 10)
 * @returns {Object} Optimized schedule
 */
function getOptimalReviewSchedule(topics, maxReviewsPerDay = 10) {
  // Sort topics by next review date and priority
  const sortedTopics = topics
    .filter(topic => topic.next_review_date)
    .sort((a, b) => {
      // Overdue topics first
      const aOverdue = new Date(a.next_review_date) < new Date();
      const bOverdue = new Date(b.next_review_date) < new Date();
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by date
      return new Date(a.next_review_date) - new Date(b.next_review_date);
    });

  const schedule = {};
  let currentDate = new Date();
  
  // Distribute topics across days
  sortedTopics.forEach((topic, index) => {
    const dayOffset = Math.floor(index / maxReviewsPerDay);
    const scheduleDate = new Date(currentDate);
    scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
    
    const dateKey = scheduleDate.toISOString().split('T')[0];
    
    if (!schedule[dateKey]) {
      schedule[dateKey] = [];
    }
    
    schedule[dateKey].push({
      ...topic,
      scheduledDate: dateKey,
      priority: index < maxReviewsPerDay ? 'high' : 'normal'
    });
  });

  return {
    schedule,
    totalTopics: topics.length,
    daysNeeded: Object.keys(schedule).length,
    averageReviewsPerDay: topics.length / Object.keys(schedule).length
  };
}

/**
 * Format interval in human-readable form
 * @param {number} intervalDays - Interval in days
 * @returns {string} Human-readable interval
 */
function formatInterval(intervalDays) {
  if (intervalDays === 0) return 'Today';
  if (intervalDays === 1) return 'Tomorrow';
  if (intervalDays < 7) return `${intervalDays} days`;
  if (intervalDays < 30) return `${Math.round(intervalDays / 7)} weeks`;
  if (intervalDays < 365) return `${Math.round(intervalDays / 30)} months`;
  return `${Math.round(intervalDays / 365)} years`;
}

/**
 * Get learning insights based on review history
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Learning insights
 */
function getLearningInsights(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      trend: 'stable',
      recommendation: 'Continue regular reviews',
      strongestArea: 'N/A',
      weakestArea: 'N/A'
    };
  }

  // Analyze recent performance
  const recentReviews = reviews.slice(-10); // Last 10 reviews
  const recentAverage = recentReviews.reduce((sum, r) => sum + r.quality_rating, 0) / recentReviews.length;
  
  // Analyze trend
  const oldReviews = reviews.slice(-20, -10); // Reviews 10-20 ago
  const oldAverage = oldReviews.length > 0 
    ? oldReviews.reduce((sum, r) => sum + r.quality_rating, 0) / oldReviews.length
    : recentAverage;

  let trend = 'stable';
  if (recentAverage > oldAverage + 0.5) trend = 'improving';
  else if (recentAverage < oldAverage - 0.5) trend = 'declining';

  // Generate recommendation
  let recommendation = 'Continue regular reviews';
  if (trend === 'improving') {
    recommendation = 'Great progress! Keep up the good work';
  } else if (trend === 'declining') {
    recommendation = 'Consider reviewing more frequently or adjusting study methods';
  } else if (recentAverage < 3) {
    recommendation = 'Focus on understanding fundamentals before moving forward';
  }

  return {
    trend,
    recommendation,
    recentAverage: Math.round(recentAverage * 100) / 100,
    totalReviews: reviews.length
  };
}

module.exports = {
  calculateNextReview,
  calculateNextReviewDate,
  getQualityRatingDescription,
  validateQualityRating,
  getRecommendedQualityRating,
  calculateLearningEfficiency,
  predictMastery,
  getOptimalReviewSchedule,
  formatInterval,
  getLearningInsights
};

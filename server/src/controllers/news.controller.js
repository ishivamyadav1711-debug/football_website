exports.getTrendingNews = (req, res, next) => {
  try {
    // API-Football does not provide news.
    // Returning empty data to handle gracefully on the frontend.
    res.json({
      success: true,
      data: {
        featured: null,
        sidebar: []
      }
    });
  } catch (err) {
    next(err);
  }
};

const Article = require('../models/Article');

exports.getArticleById = async(req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).send("Article not found");
        res.render('article', { article });
    } catch (err) {
        res.status(500).send("Server error");
    }
};
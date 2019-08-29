exports.getPosts = (req, res, next) => {
    // do not call res render because we are not rendering views in API, instead data
    // you want to insert http status in there as highly recommended practice in API
    res.status(200).json({
        posts: [{ title: 'First Post', content: 'This is the first post!' }]
    });
};

exports.createPost = (req, res, next) => {
    // body-parser package allows us to read json data in body
    const title = req.body.title;
    const content = req.body.content;
    // Create post in db
    // status 201 is success(status 200) AND resource was created
    res.status(201).json({
        message: 'Post created successfully!',
        post: { id: new Date().toISOString(), title: title, content: content }
    });
};


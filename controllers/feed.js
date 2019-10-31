const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    // do not call res render because we are not rendering views in API, instead data
    // you want to insert http status as it is highly recommended practice in API
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();
        //.then(count => {
        //totalItems = count;
        //return Post.find()
        const posts = await Post.find()
            .populate('creator')    // name of the author of post
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        // })
        // .then(posts => {
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });
    } catch (err) {
        if (!err.statusCode) {
                    err.statusCode = 500;
        }
        next(err);
    }
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500;
        //     }
        //     next(err);
        // });
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, data input is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    // body-parser package allows us to read json data in body
    const title = req.body.title;
    const content = req.body.content;
    // let creator; //dont need in aync await
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    try {
        // saving post with the given user poster posting it
        // dont store constant on await here result variable is not used
        await post.save();
        // .then(result => {
        const user = await User.findById(req.userId);
        // })
        // access post of the user and push it
        // .then(user => {
        // creator = user; // dont need in aync await
        user.posts.push(post);
        await user.save();
        io.getIO().emit('posts', {
            action: 'create',
            post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
        });
        // })
        // .then(result => {
        // status 201 is success(status 200) AND resource was created
        res.status(201).json({
            message: 'Post created successfully!',
            // return post instead of result because last then ends with user information not the post
            post: post,
            // pushing extra information with response
            creator: {_id: user._id, name: user.name}
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500;
        //     }
        //     next(err);
        // });
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;   // must match param in routes/feed
    const post = await Post.findById(postId);
    try {
        // .then(post => {
        if (!post) {
            const error = new Error('Could not find postId');
            error.statusCode = 404;
            throw error;    // throwing an error inside of a then block still goes into catch block so it does go into next.
        }
        res.status(200).json({message: 'Post fetched.', post: post});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500;
        //     }
        //     next(err);
        // });
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, data input is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file chosen.');
        error.statusCode = 422;
        throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    try {
        // .then(post => {
        if (!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized user.');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        io.getIO().emit('posts', { action: 'update', post: result });
        // })
        // .then(result => {
        res.status(200).json({message: 'Post updated.', post: result});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500;
        //     }
        //     next(err);
        // });
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    try {
        // .then(post => {
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized user.');
            error.statusCode = 403;
            throw error;
        }
        //check logged in user
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        // })
        // .then(result => {
        const user = await User.findById(req.userId);
        // })
        // .then(user => {
        // pull method from mongoose and pass the post Id through it to grab the post we deleted out of the db
        user.posts.pull(postId);
        await user.save();
        io.getIO().emit('posts', { action: 'delete', post: postId });
        // })
        // .then(result => {
        res.status(200).json({message: 'Post deleted.'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500;
        //     }
        //     next(err);
        // });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};

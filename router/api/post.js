const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/profile');
const User = require('../../models/User');
const Post = require('../../models/post');

// @route   Post api/post
// @ desc   create a post
// @access  private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   Get api/post
// @ desc   Get all posts
// @access  private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   Get api/post/:id
// @ desc   Get all posts by id
// @access  private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   Delete api/post/:id
// @ desc   Delete a posts
// @access  private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    // Check on the user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User noy authorized' });
    }
    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   Put api/post/like/id
// @ desc   Like a posts
// @access  private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check ifthe post has already liked by the user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   Delete api/post/unlike/id
// @ desc   dislike a posts
// @access  private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already liked by the user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Get the remove idex
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   Post api/post/comment/:id
// @ desc   Comment on a post
// @access  private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   Delete api/post/comment/:id/:comment_id
// @ desc   Delete comment
// @access  private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // pull all coment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exsit
    if (!comment) {
      return res.status(404).json({ msg: 'Cooment does not exsit' });
    }

    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'User no authorized' });
    }

    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

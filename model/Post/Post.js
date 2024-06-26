const mongoose = require('mongoose');

// create a schema

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required:[true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required:[true, 'Description is required'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    numViews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please Author is required']
    },
    photo: {
        type: String,
        require: [true, 'Photo is required'],
    },
},
{
    timestamps: true,
    toJSON: {virtuals: true},
}
);

// HOOK
postSchema.pre(/^find/, async function(next){
    //add views count as virtual field
    postSchema.virtual('numViewsCount').get(function(){
        return this.numViews.length;
    });
    //add likes count as virtual field
    postSchema.virtual('likesCount').get(function(){
        return this.likes.length;
    });
    //add likes count as virtual field
    postSchema.virtual('dislikesCount').get(function(){
        return this.dislikes.length;
    });
    // check the most liked post in percentage
    parseInt(postSchema.virtual('likePercentage').get(function(){
        // return this.likes.length / (this.likes.length + this.dislikes.length) * 100;
        const total = +this.likes.length + +this.dislikes.length;
        const percentage = (this.likes.length / total) * 100;
        return `${percentage}%`;
    }));

    // check the most disliked post in percentage
    parseInt(postSchema.virtual('dislikePercentage').get(function(){
        // return this.likes.length / (this.likes.length + this.dislikes.length) * 100;
        const total = +this.dislikes.length + +this.dislikes.length;
        const percentage = (this.dislikes.length / total) * 100;
        return `${percentage}%`;
    }));

    // if day is less 0 return today if day is greater than 0 return yesterday or days ago
    postSchema.virtual('DAYSaGO').get(function(){
        const post = this
        const date = new Date(post.createdAt);
        const daysAgo = Math.floor((Date.now() - date) / 8640000);
        return daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
    });
    next();
});
const post = mongoose.model('Post', postSchema);

module.exports = post
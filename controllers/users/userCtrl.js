const User = require('../../model/User/User'); 
const bcrypt = require('bcrypt');
const generateToken = require('../../utils/generateToken');
const getTokenFromHeader = require('../../utils/getTokenFromHeaders');
const { appErr, AppErr } = require('../../utils/appErr');
const storage = require('../../config/cloudinary');

// ---------------------- Users ----------------------------------

// register
const userRegisterCtrl = async (req, res, next) => {
    const {
        firstname,
        lastname,
        email,
        password
    } = req.body;

    try {
    // Vérifier si l'utilisateur existe déjà
    const userFound = await User.findOne({ email });
    if (userFound) {
        return next(new AppErr('User already exists', 404));
    }

        // Hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer un nouvel utilisateur
        const user = await User.create({
            firstname,
            lastname,
            email,
            password: hashedPassword
        });
        return res.json({
            status: 'succès',
            data: user
        });
    } catch (err) {
        next(appErr(err.message));
    }
};


// login
const userLoginCtrl = async(req, res) => {
    const { email, password } = req.body;
    try{
        // check id email exist
        const userFound = await User.findOne({ email });

        if(!userFound){
            return res.json({
                status: 'fail',
                message: 'Invalid email or password'
            });
        }

        // validate password
        const isPasswordMatch = await bcrypt.compare(password, userFound.password);

        if(!isPasswordMatch){
            return res.json({
                status: 'fail',
                message: 'Invalid email or password'
            });
        }

        res.json({
            status: 'success',
            data: {
                firstname: userFound.firstname,
                lastname: userFound.lastname,
                email: userFound.email,
                isAdmin: userFound.isAdmin,
                token: generateToken(userFound._id)
            },
        })
    } catch(err){
        res.json({
            message: err.message
        })
    }
};

// get one user(Profile)
const userGetOneCtrl = async(req, res) => {
    try{
        const user = await User.findById(req.userAuth);
        res.json({
            status: 'success',
            data: user
        })
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
}


// get all user
const userGetAllCtrl = async(req, res) => {
    try{
        res.json({
            status: 'success',
            message: 'all User fetched successfully'
        })
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
};

// update user
const updateUserCtrl = async(req, res) => {
    try{
        res.json({
            status: 'success',
            message: 'Profile update successfully'
        })
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
};

// Profile photo Upload
const profilePhototoUploadCtrl = async(req, res, next) => {
    // console.log(req.file);
    // 1.find the user to be updated
    const userToUpdate = await User.findById(req.userAuth);
    // 2.check if user is found
    if(!userToUpdate){
        return next(appErr('User not found', 404));
    }
    // 3. check if user is blocked
    if(userToUpdate.isBlocked){
        return next(appErr('Action not allowed your account is blocked', 403));
    }
    // 4.check if a user is updating their photo
    if(req.file){
        try{
            // 5. update the user profile photo
            await User.findByIdAndUpdate(
                req.userAuth, 
                {
                    $set:{
                        profilePhoto: req.file.path
                    },
                },
                {
                    new: true,
                }
            );
            res.json({
                status: 'success',
                data: 'Profile photo uploaded successfully humm'
            })
        } catch(err){
            next(appErr(err.message, 500));
        }
    }
};


// delete user
const deleteUserCtrl = async(req, res) => {
    try{
        res.json({
            status: 'success',
            message: 'Profile delete successfully'
        })
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
};


// logout
const userLogoutCtrl = async(req, res) => {
    try{
        res.json({
            status: 'success',
            message: 'User logout successfully'
        })
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
}


// ---------------------- Users-Viewers ----------------------------------

// who view my profile
const whoViewMyProfileCtrl = async(req, res, next) => {
    try{
        // 1.find the original user
        const user = await User.findById(req.params.id);
        // 2.find the user who view the original user
        const userWhoView = await User.findById(req.userAuth);

        // 3.check if original user who view are found
        if (user && userWhoView) {
            //4. check if userWhoView is already in the viewers array
            const isUserAlreadyViewed = user.viewers.find(
                viewer => viewer.toString() === userWhoView._id.toString()
            );
            if (isUserAlreadyViewed) {
                next(appErr('User already viewed', 404));
            } else {
                // 5.push the userWhovied the users's viewers array
                user.viewers.push(userWhoView._id);
                // 6. save the user
                await user.save();
                res.json({
                    status: 'success',
                    data: 'You have successfully viewed this profile'
                });
            }
        }
    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
};

// ---------------------- Users-follows and followers ----------------------------------
// followings users
const followingCtrl = async(req, res, next) => {
    try{
        // 1.findthe user to be followed
        const userToFollow = await User.findById(req.params.id);

        // 2.find the user who is follow
        const userWhoFollow = await User.findById(req.userAuth);

        // 3.check if userToFollow and userWhoFollow are found
        if(userToFollow && userWhoFollow){
            // 4.check if userWhoFollow is already in the following array
            const isUserAlreadyFollowing = userToFollow.following.find(
                follower => follower.toString() === userWhoFollow._id.toString()
            );
            if(isUserAlreadyFollowing){
                next(appErr('User already following', 404))
            } else {
                // 5.push the userWhoFollow to the userToFollow followers array
                userToFollow.followers.push(userWhoFollow._id);
                // 6.push the userToFollow to the userWhoFollow following array
                userWhoFollow.following.push(userToFollow._id);
                // 6.save the userToFollow
                await userWhoFollow.save();
                await userToFollow.save();
                res.json({
                    status: 'success',
                    message: 'you have successfully followed this user'
                })
            }
        }

    } catch(err){
        res.json({
            status: 'fail',
            message: err.message
        })
    }
};

// ---------------------- Users-Unfollows ----------------------------------

// export
module.exports = {
    userRegisterCtrl,
    userLoginCtrl,
    userGetOneCtrl,
    userGetAllCtrl,
    updateUserCtrl,
    deleteUserCtrl,
    userLogoutCtrl,
    profilePhototoUploadCtrl,
    whoViewMyProfileCtrl,
    followingCtrl,
}
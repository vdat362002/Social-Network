import Filter from 'bad-words';


const sessionizeUser = (user) => ({
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    firstname: user.firstname,
    lastname: user.lastname,
    profilePicture: user.profilePicture
})

const makeResponseJson = (data, success = true) => {
    return {
        // ...initStatus,
        status_code: 200,
        success,
        data,
        timestamp: new Date()
    };
}

const newBadWords = [
    'gago', 'puta', 'animal', 'porn', 'amputa', 'tangina', 'pota', 'puta', 'putangina',
    'libog', 'eut', 'iyot', 'iyutan', 'eutan', 'umiyot', 'karat', 'pornhub', 'ptngina', 'tngina'
];

const filterWords = new Filter();
filterWords.addWords(...newBadWords);

export { sessionizeUser, makeResponseJson, filterWords };


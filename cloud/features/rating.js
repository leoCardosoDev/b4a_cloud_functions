const Rating = Parse.Object.extend('Rating');
const Professional = Parse.Object.extend('Professional');


Parse.Cloud.define('v1-rate-professional', async (req) => {
    const professional = new Professional();
    professional.id = req.params.professionalId;

    const queryRatings = new Parse.Query(Rating);
    queryRatings.equalTo('user', req.user);
    queryRatings.equalTo('professional', professional);
    const existingRating = await queryRatings.first({useMasterKey: true});

    if(existingRating) await existingRating.destroy({useMasterKey: true});

    const rating = new Rating();
    rating.set('user', req.user);
    rating.set('professional', professional);
    rating.set('stars', req.params.stars);
    rating.set('comments', req.params.comments);
    await rating.save(null, {useMasterKey: true});

    return rating;
}, {
    requireUser: true,
    fields: {
        professionalId: {
            required: true,
        },
        stars: {
            required: true,
        },
        comments: {
            required: false,
            type: String,
            options: val => {
                return val.length < 80;
            },
        }
    }
});

Parse.Cloud.afterSave(Rating, async (request) => {
    const rating = request.object;
    const professional = rating.get('professional');
    await professional.fetch({useMasterKey: true});

    const currentRating = professional.get('rating') || 0;
    const currentRatingCount = professional.get('ratingCount') || 0;

    const newRating = (currentRating * currentRatingCount + rating.get('stars')) / (currentRatingCount + 1);

    professional.set('rating', newRating);
    professional.increment('ratingCount', 1);
    await professional.save(null, {useMasterKey: true});
  });

Parse.Cloud.afterDelete(Rating, async (request) => {
    const rating = request.object;
    const professional = rating.get('professional');
    await professional.fetch({useMasterKey: true});

    const newRating = (professional.get('rating') * professional.get('ratingCount') - rating.get('stars')) / (professional.get('ratingCount') - 1);

    professional.set('rating', newRating);
    professional.increment('ratingCount', -1);
    await professional.save(null, {useMasterKey: true});
});
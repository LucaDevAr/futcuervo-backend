// backend/src/services/pointsService.js
import User from "../models/User.js";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";

export const updatePoints = async ({ userId, clubId, won }) => {
  const pointsAdded = { user: 0, club: 0, clubMember: 0 };

  if (!won) return pointsAdded;

  // 1️⃣ Sumar punto al usuario
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { points: 1 } },
    { new: true }
  );
  pointsAdded.user = 1;

  // 2️⃣ Sumar punto al club y clubMember si existe clubId
  if (clubId) {
    const clubMember = await ClubMember.findOne({ userId, clubId });
    if (clubMember) {
      await Club.findByIdAndUpdate(clubId, { $inc: { points: 1 } });
      await ClubMember.findByIdAndUpdate(clubMember._id, {
        $inc: { points: 1 },
      });
      pointsAdded.club = 1;
      pointsAdded.clubMember = 1;
    }
  }

  return pointsAdded;
};

import Video from "../../models/Video.js";

// Helper function to fetch YouTube thumbnail
export const fetchYouTubeThumbnail = async (videoId) => {
  try {
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const response = await fetch(thumbnailUrl, { method: "HEAD" });
    if (response.ok) return thumbnailUrl;
    return `https://img.youtube.com/vi/${videoId}/default.jpg`;
  } catch (error) {
    console.error("Error fetching YouTube thumbnail:", error);
    return null;
  }
};

// ================= GET all videos =================
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Error fetching videos" });
  }
};

// ================= POST create video =================
export const createVideo = async (req, res) => {
  try {
    const { title, videoUrl } = req.body;
    if (!title || !videoUrl)
      return res.status(400).json({ error: "Missing required fields" });

    // Extract YouTube ID
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    const thumbnailUrl = await fetchYouTubeThumbnail(videoId);

    const videoData = {
      title,
      videoUrl,
      videoId,
      thumbnailUrl,
      createdAt: new Date(),
    };

    const video = await Video.create(videoData);
    res.json({ success: true, video });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Error creating video" });
  }
};

// ================= GET single video =================
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Error fetching video" });
  }
};

// ================= PATCH update video =================
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoUrl, videoId: bodyVideoId } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;

    // Update videoId and thumbnail if URL or videoId changed
    let newVideoId = null;
    if (videoUrl) {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = videoUrl.match(regExp);
      newVideoId = match && match[2].length === 11 ? match[2] : null;
    } else if (bodyVideoId) {
      newVideoId = bodyVideoId;
    }

    if (newVideoId) {
      updateData.videoId = newVideoId;
      updateData.thumbnailUrl = await fetchYouTubeThumbnail(newVideoId);
    }

    const updatedVideo = await Video.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedVideo)
      return res.status(404).json({ error: "Video not found" });

    res.json({ success: true, video: updatedVideo });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ error: "Error updating video" });
  }
};

// ================= DELETE video =================
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVideo = await Video.findByIdAndDelete(id);
    if (!deletedVideo)
      return res.status(404).json({ error: "Video not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Error deleting video" });
  }
};

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// [중요] CORS 설정: 모든 도메인에서 접속할 수 있도록 허용합니다.
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 1. MongoDB 연결
// Render의 Environment 탭에 MONGO_URI가 반드시 설정되어 있어야 합니다.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected...'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. 데이터 모델 정의
const TeamSchema = new mongoose.Schema({
    teamName: String,
    captainName: String,
    tier: String,
    date: { type: Date, default: Date.now }
});
const Team = mongoose.model('Team', TeamSchema);

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 3. API 라우트

// (1) 회원가입
app.post('/api/signup', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const newUser = new User({ userId, password });
        await newUser.save();
        res.status(201).json({ message: "회원가입 성공" });
    } catch (err) {
        res.status(400).json({ message: "이미 존재하는 아이디입니다." });
    }
});

// (2) 로그인
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId, password });
    if (user) {
        res.json({ user: user.userId });
    } else {
        res.status(401).json({ message: "로그인 실패" });
    }
});

// (3) 대회 신청
app.post('/api/register', async (req, res) => {
    try {
        const newTeam = new Team(req.body);
        await newTeam.save();
        res.status(201).json({ message: "신청 완료" });
    } catch (err) {
        res.status(500).json({ message: "신청 실패" });
    }
});

// (4) 신청 현황 조회
app.get('/api/register', async (req, res) => {
    const teams = await Team.find().sort({ date: -1 });
    res.json(teams);
});

// (5) 신청 삭제 (관리자 전용)
app.delete('/api/register/:id', async (req, res) => {
    const { userId } = req.query;
    if (userId !== 'hanbyeol677') {
        return res.status(403).send("권한이 없습니다.");
    }
    await Team.findByIdAndDelete(req.params.id);
    res.send("삭제 성공");
});

// 4. 서버 실행
// [중요] Render는 process.env.PORT를 사용해야 연결됩니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

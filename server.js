require('dotenv').config(); // 최상단에 추가 (환경 변수 로드)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// [수정] 직접적인 주소 대신 환경 변수 사용
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB 연결 성공!'))
    .catch(err => console.log('연결 실패:', err));

// 관리자 아이디 설정
const ADMIN_ID = 'hanbyeol677';

// --- 스키마 및 모델 ---
const RegistrationSchema = new mongoose.Schema({
    teamName: String,
    captainName: String,
    tier: String,
    createdAt: { type: Date, default: Date.now }
});
const Registration = mongoose.model('Registration', RegistrationSchema);

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// --- API 경로 ---

app.post('/api/register', async (req, res) => {
    try {
        const newReg = new Registration(req.body);
        await newReg.save();
        res.status(201).send("신청 성공!");
    } catch (error) {
        res.status(500).send("저장 실패");
    }
});

app.get('/api/register', async (req, res) => {
    try {
        const teams = await Registration.find().sort({ createdAt: -1 });
        res.json(teams);
    } catch (error) {
        res.status(500).send("조회 실패");
    }
});

app.delete('/api/register/:id', async (req, res) => {
    const { userId } = req.query;
    if (userId !== ADMIN_ID) return res.status(403).send("권한이 없습니다.");
    try {
        await Registration.findByIdAndDelete(req.params.id);
        res.send("삭제 성공!");
    } catch (error) {
        res.status(500).send("삭제 실패");
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const newUser = new User({ userId, password });
        await newUser.save();
        res.status(201).send("회원가입 완료!");
    } catch (error) {
        res.status(500).send("가입 실패");
    }
});

app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId, password });
    if (user) {
        res.send({ message: "로그인 성공", user: user.userId, isAdmin: (user.userId === ADMIN_ID) });
    } else {
        res.status(401).send("아이디/비번 오류");
    }
});

// [수정] 포트 설정 (배포 환경 대비)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

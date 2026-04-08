// 1. 설정: API 주소
const REG_API_URL = 'http://localhost:3000/api/register';
const ADMIN_ID = 'hanbyeol677';

// 2. 페이지 로드 시 실행
window.onload = function() {
    checkLogin();
};

// 3. 로그인 상태 체크 및 UI 업데이트
function checkLogin() {
    const user = localStorage.getItem('loggedInUser');
    const loggedInUI = document.getElementById('loggedInUI');
    const loggedOutUI = document.getElementById('loggedOutUI');
    const userNameDisplay = document.getElementById('userNameDisplay');

    if (user) {
        if (loggedInUI) loggedInUI.style.display = 'flex';
        if (loggedOutUI) loggedOutUI.style.display = 'none';
        if (userNameDisplay) userNameDisplay.innerText = user;
    } else {
        if (loggedInUI) loggedInUI.style.display = 'none';
        if (loggedOutUI) loggedOutUI.style.display = 'block';
    }
}

// 4. 로그아웃 기능
function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem('loggedInUser');
        alert("성공적으로 로그아웃되었습니다.");
        location.reload();
    }
}

// 5. 대회 참가 신청하기 (누구나 가능하게 수정됨)
document.getElementById('regForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // [변경됨] 로그인 체크 로직 삭제 -> 바로 신청 가능
    const teamData = {
        teamName: document.getElementById('teamName').value,
        captainName: document.getElementById('captainName').value,
        tier: document.getElementById('tier').value
    };

    try {
        const response = await fetch(REG_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
        });

        if (response.ok) {
            alert('성공적으로 신청되었습니다!');
            this.reset();
            
            // 신청 후 목록이 이미 열려있었다면(회원인 경우) 새로고침
            const container = document.getElementById('teamListContainer');
            if (container && !container.classList.contains('hidden')) {
                loadTeams(); 
            }
        } else {
            alert('신청 중 오류가 발생했습니다.');
        }
    } catch (error) {
        alert('서버와 연결할 수 없습니다.');
    }
});

// 6. 신청 현황 불러오기 및 토글 (로그인 체크 로직 추가됨)
document.getElementById('loadTeamsBtn')?.addEventListener('click', function() {
    const container = document.getElementById('teamListContainer');
    const btn = this;
    const user = localStorage.getItem('loggedInUser');

    // [변경됨] 현황을 보려고 할 때 로그인 체크
    if (!user) {
        alert("신청 현황을 확인하려면 로그인이 필요합니다.");
        location.href = 'login.html';
        return;
    }

    if (container.classList.contains('hidden')) {
        loadTeams(); 
        container.classList.remove('hidden');
        btn.innerText = '현황 닫기';
    } else {
        container.classList.add('hidden');
        btn.innerText = '신청 현황 보기';
    }
});

// 7. 실제 데이터 불러오기 함수
async function loadTeams() {
    const tbody = document.getElementById('teamListBody');
    const currentUser = localStorage.getItem('loggedInUser');

    try {
        const response = await fetch(REG_API_URL);
        const teams = await response.json();

        tbody.innerHTML = '';
        
        teams.forEach(team => {
            // 관리자(hanbyeol677)일 경우에만 삭제 버튼 생성
            const isAdmin = (currentUser === ADMIN_ID);
            const deleteBtnHtml = isAdmin 
                ? `<td><button onclick="deleteTeam('${team._id}')" class="delete-btn">삭제</button></td>` 
                : '';

            const row = `<tr>
                <td>${team.teamName}</td>
                <td>${team.captainName}</td>
                <td>${team.tier}</td>
                ${deleteBtnHtml}
            </tr>`;
            tbody.innerHTML += row;
        });

        // 관리자라면 헤더에 '관리' 컬럼 추가 (중복 방지 체크)
        const headerRow = document.querySelector('#teamTable thead tr');
        if (currentUser === ADMIN_ID && headerRow.cells.length === 3) {
            const th = document.createElement('th');
            th.innerText = '관리';
            headerRow.appendChild(th);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('데이터를 불러오지 못했습니다.');
    }
}

// 8. 팀 삭제 기능 (관리자 전용)
async function deleteTeam(teamId) {
    if (!confirm("정말 이 팀의 신청을 삭제하시겠습니까?")) return;

    const currentUser = localStorage.getItem('loggedInUser');

    try {
        const response = await fetch(`${REG_API_URL}/${teamId}?userId=${currentUser}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("삭제 성공!");
            loadTeams(); 
        } else {
            const errorMsg = await response.text();
            alert("삭제 실패: " + errorMsg);
        }
    } catch (error) {
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}
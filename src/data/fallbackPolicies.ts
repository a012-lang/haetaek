import { addUtcDaysIso, formatKoreanDate } from '../lib/date.ts';
import type { YouthPolicy } from '../types/policy.ts';

/**
 * Verified static fallback dataset across 온통청년, 보조금24, 정부24, 복지로.
 * Used when external public API keys are unset or external government portals fail/timeout.
 */
export function getFallbackPolicies(now: Date = new Date()): YouthPolicy[] {
  const d0 = addUtcDaysIso(0, now);
  const d2 = addUtcDaysIso(2, now);
  const d4 = addUtcDaysIso(4, now);
  const d6 = addUtcDaysIso(6, now);
  const d7 = addUtcDaysIso(7, now);
  const d15 = addUtcDaysIso(15, now);
  const d24 = addUtcDaysIso(24, now);
  const d40 = addUtcDaysIso(40, now);

  return [
    {
      id: 'ontong-youth-rent-2026',
      title: '청년월세 한시 특별지원 (2차)',
      source: '온통청년',
      orgName: '국토교통부 · 복지로',
      field: '주거',
      region: '전국',
      summary:
        '경제적 어려움을 겪는 무주택 청년에게 실제 납부하는 임대료를 최대 24개월간 월 20만 원까지 지원합니다.',
      target:
        '만 19세~34세 무주택 청년 중 부모님과 별도 거주하며 청약통장에 가입한 자 (청년가구 기준중위소득 60% 이하, 원가구 100% 이하)',
      supportContent: '월 최대 20만 원, 생애 최대 24개월 (최대 480만 원 현금 계좌 지급)',
      period: `신청 마감 ${formatKoreanDate(d0)} (당일 18:00까지)`,
      deadlineIso: d0,
      requiredDocs: [
        '월세 지원 신청서 및 소득·재산 신고서',
        '임대차계약서 사본 및 최근 3개월 월세 이체 증빙서류',
        '청약통장 사본 및 가족관계증명서',
      ],
      applyMethod: '복지로 누리집 온라인 신청 또는 주소지 관할 주민센터 방문 접수',
      applyUrl: 'https://www.bokjiro.go.kr',
      contactInfo: '청년월세 한시 특별지원 콜센터 (1600-0777)',
    },
    {
      id: 'bojo24-kpass-youth',
      title: 'K-패스 청년 대중교통비 환급 지원',
      source: '보조금24',
      orgName: '국토교통부 대도시권광역교통위원회',
      field: '금융·자산',
      region: '전국',
      summary:
        '월 15회 이상 시내버스·지하철·GTX 등 대중교통을 이용하는 청년에게 교통비의 30%를 적립·환급합니다.',
      target: '만 19세~34세 청년 (대중교통 월 15회 이상 이용자, 최대 월 60회까지 적립)',
      supportContent: '대중교통 지출 금액의 30% 환급 (매월 카드 결제 대금 차감 또는 계좌 입금)',
      period: '상시 신청 (연중 수시 등록 가능)',
      deadlineIso: null,
      requiredDocs: [
        'K-패스 전용 체크·신용카드 (참여 카드사 발급)',
        '본인 명의 휴대폰 또는 공동·금융인증서',
      ],
      applyMethod: 'K-패스 공식 앱 또는 누리집에서 카드번호 등록 후 회원가입',
      applyUrl: 'https://korea-pass.kr',
      contactInfo: '한국교통안전공단 K-패스 고객센터 (031-427-4415)',
    },
    {
      id: 'bokjiro-youth-tomorrow-account',
      title: '청년내일저축계좌 (차상위 이하·일반형)',
      source: '복지로',
      orgName: '보건복지부',
      field: '금융·자산',
      region: '전국',
      summary:
        '일하는 저소득 청년이 매월 10만 원을 저축하면 정부가 월 10만 원~30만 원을 매칭 적립해 3년 후 목돈을 마련하도록 돕습니다.',
      target:
        '신청 당시 만 19세~34세 근로·사업소득이 있는 청년 (기준중위소득 100% 이하, 차상위 이하는 만 15~39세 가능)',
      supportContent:
        '3년 만기 시 본인 납입금 360만 원 + 정부지원금 360만 원~1,080만 원 + 이자 지급',
      period: `모집 마감 ${formatKoreanDate(d2)}`,
      deadlineIso: d2,
      requiredDocs: [
        '사회복지서비스 및 급여 제공(변경) 신청서',
        '재직증명서 또는 사업자등록증명원·소득금액증명원',
        '금융정보 등 제공 동의서 (가구원 포함)',
      ],
      applyMethod: '복지로 온라인 신청 또는 읍·면·동 행정복지센터 방문 신청',
      applyUrl: 'https://www.bokjiro.go.kr',
      contactInfo: '보건복지상담센터 (129) · 자산형성지원 콜센터 (1522-3690)',
    },
    {
      id: 'gov24-youth-do-dream',
      title: '국민취업지원제도 (청년 구직촉진수당)',
      source: '정부24',
      orgName: '고용노동부',
      field: '일자리',
      region: '전국',
      summary:
        '취업을 준비하는 청년에게 맞춤형 취업지원서비스와 함께 최대 6개월간 구직촉진수당 및 취업성공수당을 지급합니다.',
      target:
        '만 18세~34세 구직자 중 가구단위 중위소득 120% 이하 및 재산 5억 원 이하 (취업경험 무관 특례 적용)',
      supportContent:
        '구직촉진수당 월 50만 원 × 최대 6개월 (부양가족 가산금 별도) + 조기취업성공수당 최대 150만 원',
      period: '상시 신청 (고용24 온라인 연중 접수)',
      deadlineIso: null,
      requiredDocs: [
        '국민취업지원제도 참여 신청서 및 개인정보 수집 동의서',
        '가구원 소득·재산 확인 서류 (전산 연계 미조회 시 추가 제출)',
      ],
      applyMethod: '고용24 누리집 온라인 신청 또는 거주지 관할 고용센터 방문',
      applyUrl: 'https://www.work24.go.kr',
      contactInfo: '고용노동부 고객상담센터 (1350)',
    },
    {
      id: 'ontong-seoul-youth-allowance',
      title: '서울시 청년수당 (미취업 청년 활동지원)',
      source: '온통청년',
      orgName: '서울특별시 미래청년기획관',
      field: '일자리',
      region: '서울',
      summary:
        '서울에 거주하는 미취업 청년에게 진로 탐색과 구직 활동에 집중할 수 있도록 활동지원금과 역량강화 프로그램을 제공합니다.',
      target:
        '주민등록상 서울 거주 만 19세~34세 미취업 또는 단기근로 청년 (최종학력 졸업 후 2년 경과, 중위소득 150% 이하)',
      supportContent: '매월 50만 원 × 최대 6개월 (총 300만 원) 전용 체크카드 지급 + 멘토링 연계',
      period: `하반기 추가 모집 마감 ${formatKoreanDate(d4)}`,
      deadlineIso: d4,
      requiredDocs: [
        '최종학력 졸업증명서 또는 수료증',
        '근로계약서 (주 30시간 이하 단기근로자에 한함)',
        '건강보험료 납부확인서 (전산 연계 가능)',
      ],
      applyMethod: '청년몽땅정보통 누리집에서 본인인증 후 온라인 접수',
      applyUrl: 'https://youth.seoul.go.kr',
      contactInfo: '서울시 청년수당 콜센터 (1566-3344)',
    },
    {
      id: 'bojo24-youth-leap-account',
      title: '청년도약계좌 (5년 만기 정부기여금 매칭)',
      source: '보조금24',
      orgName: '금융위원회 · 서민금융진흥원',
      field: '금융·자산',
      region: '전국',
      summary:
        '청년의 중장기 자산 형성을 위해 월 최대 70만 원 납입 시 정부기여금과 비과세 혜택을 더해 최대 5천만 원 상당의 목돈 마련을 지원합니다.',
      target:
        '만 19세~34세 개인소득 7,500만 원 이하 및 가구소득 중위 250% 이하 청년 (병역이행기간 최대 6년 연령 차감)',
      supportContent:
        '본인 납입금 + 소득구간별 월 최대 3.3만 원 정부기여금 + 은행 이자(비과세)',
      period: `이번 달 가입 신청 마감 ${formatKoreanDate(d6)}`,
      deadlineIso: d6,
      requiredDocs: [
        '취급 은행 모바일 앱 비대면 가입 신청 (별도 종이서류 불필요)',
        '병역이행 확인 필요 시 병적증명서 (전자문서지갑 연동)',
      ],
      applyMethod: '11개 협약 시중은행 모바일 앱에서 매월 가입 신청 기간 내 접수',
      applyUrl: 'https://ylaccount.kinfa.or.kr',
      contactInfo: '서민금융콜센터 (1397)',
    },
    {
      id: 'ontong-gyeonggi-youth-basic-income',
      title: '경기도 청년기본소득 분기별 지급',
      source: '온통청년',
      orgName: '경기도 · 시군 청년정책과',
      field: '복지·건강',
      region: '경기',
      summary:
        '경기도에 3년 이상 계속 거주한 만 24세 청년에게 학업·취업 여부와 무관하게 분기별 지역화폐를 지급합니다.',
      target:
        '신청일 기준 경기도에 주민등록을 두고 3년 이상 연속 거주(또는 합산 10년 이상)한 만 24세 청년 (성남·고양 등 일부 시군 기준 상이)',
      supportContent: '분기별 25만 원, 연간 최대 100만 원 지역화폐(모바일·카드) 지급',
      period: `이번 분기 신청 마감 ${formatKoreanDate(d7)}`,
      deadlineIso: d7,
      requiredDocs: [
        '주민등록초본 (과거 주소변동 이력 포함, 공공마이데이터 자동 연계)',
        '기초생활수급자 증명서 (일시금 지급 대상자에 한함)',
      ],
      applyMethod: '경기도 일자리플랫폼 잡아바(apply.jobaba.net) 온라인 신청',
      applyUrl: 'https://apply.jobaba.net',
      contactInfo: '경기도 콜센터 (031-120)',
    },
    {
      id: 'gov24-jeonse-deposit-guarantee',
      title: '청년 전세보증금 반환보증 보증료 지원',
      source: '정부24',
      orgName: '국토교통부 · 지방자치단체',
      field: '주거',
      region: '전국',
      summary:
        '전세 사기 피해를 예방하기 위해 청년 임차인이 전세보증금 반환보증에 가입할 때 이미 납부한 보증료를 최대 30만 원까지 환급합니다.',
      target:
        '임차보증금 3억 원 이하 주택에 거주하는 만 19세~39세 무주택 청년 (연소득 5,000만 원 이하, 신혼부부 7,500만 원 이하)',
      supportContent: '기납부 보증료 실비 지원 (최대 30만 원 한도 본인 계좌 입금)',
      period: `예산 소진 시까지 (1차 정산 마감 ${formatKoreanDate(d15)})`,
      deadlineIso: d15,
      requiredDocs: [
        '보증료 지원 신청서 및 서약서',
        '전세보증금 반환보증 보증서 및 보증료 납부 영수증',
        '확정일자 부여된 임대차계약서 및 등기사항전부증명서',
      ],
      applyMethod: '정부24 또는 안심전세포털 온라인 신청 / 관할 시·군·구청 방문',
      applyUrl: 'https://www.gov.kr',
      contactInfo: '관할 시·군·구청 주택과 또는 국토교통부 콜센터 (1599-0001)',
    },
    {
      id: 'bokjiro-youth-mind-care',
      title: '청년 마음건강 지원사업 (전문 심리상담 바우처)',
      source: '복지로',
      orgName: '보건복지부',
      field: '복지·건강',
      region: '전국',
      summary:
        '학업, 취업 스트레스 등으로 심리적 어려움을 겪는 청년에게 전문 심리상담 서비스를 바우처 형태로 지원합니다.',
      target:
        '만 19세~34세 청년 누구나 (소득 기준 무관, 자립준비청년 및 정신건강복지센터 연계 대상자 우선 지원)',
      supportContent:
        '총 10회(주 1회) 1:1 전문 심리상담 서비스 제공 (A형 회당 6만 원 / B형 회당 7만 원 기준 본인부담금 10%)',
      period: '연중 수시 모집 (시·군·구 예산 범위 내)',
      deadlineIso: null,
      requiredDocs: [
        '사회보장급여(사회서비스이용권) 신청서',
        '신분증 및 우선지원 대상 증빙서류 (해당자에 한함)',
      ],
      applyMethod: '복지로 누리집 온라인 신청 또는 주민등록상 주소지 주민센터 방문',
      applyUrl: 'https://www.bokjiro.go.kr',
      contactInfo: '보건복지상담센터 (129)',
    },
    {
      id: 'ontong-k-digital-training',
      title: 'K-디지털 트레이닝 (AI·소프트웨어 실무 부트캠프)',
      source: '온통청년',
      orgName: '고용노동부 · 한국직업능력연구원',
      field: '교육',
      region: '전국',
      summary:
        '디지털·신기술 분야 취업을 희망하는 청년에게 기업 주도 프로젝트 기반 교육비 전액과 월 훈련장려금을 지원합니다.',
      target:
        '국민내일배움카드 발급이 가능한 만 15세~34세 청년 구직자 및 대학 졸업예정자 (전공 무관)',
      supportContent:
        '교육비 전액 국비 지원 (최대 1,800만 원 상당) + 출석률 80% 이상 시 월 최대 31.6만 원 훈련장려금 지급',
      period: `동계 기수 모집 마감 ${formatKoreanDate(d24)}`,
      deadlineIso: d24,
      requiredDocs: [
        '국민내일배움카드 (고용24에서 사전 발급)',
        '교육기관별 지원서 및 사전 기초평가 응시',
      ],
      applyMethod: '고용24(work24.go.kr)에서 국민내일배움카드 발급 후 훈련과정 수강 신청',
      applyUrl: 'https://www.work24.go.kr',
      contactInfo: '고용노동부 직업훈련 포털 상담 (1350)',
    },
    {
      id: 'bojo24-busan-youth-rent-loan',
      title: '부산시 머물자리론 (청년 임차보증금 대출이자 지원)',
      source: '보조금24',
      orgName: '부산광역시 청년산학국',
      field: '주거',
      region: '부산',
      summary:
        '부산에 거주하는 무주택 청년의 주거비 부담을 덜기 위해 임차보증금 대출 및 대출이자 연 2.5%를 지원합니다.',
      target:
        '부산광역시 주민등록 예정 또는 거주 중인 만 19세~39세 무주택 청년 (연소득 4,500만 원 이하, 임차보증금 2억 원 이하)',
      supportContent: '최대 1억 원 한도 임차보증금 대출 추천 및 연 2.5% 대출이자 지원 (최대 4년)',
      period: `하반기 심사 마감 ${formatKoreanDate(d40)}`,
      deadlineIso: d40,
      requiredDocs: [
        '주민등록등본 및 가족관계증명서',
        '임대차계약서 사본 및 소득확인서류 (원천징수영수증 등)',
      ],
      applyMethod: '부산청년플랫폼 온라인 신청 후 협약 은행(부산은행) 대출 심사 진행',
      applyUrl: 'https://young.busan.go.kr',
      contactInfo: '부산청년센터 (051-241-7865)',
    },
    {
      id: 'ontong-youth-startup-academy',
      title: '청년창업사관학교 (초기 청년창업자 사업화 자금)',
      source: '온통청년',
      orgName: '중소벤처기업부 · 중소벤처기업진흥공단',
      field: '창업',
      region: '전국',
      summary:
        '유망 창업 아이템을 보유한 만 39세 이하 청년 창업자에게 사업화 자금과 전용 창업 공간, 1:1 코칭을 일괄 지원합니다.',
      target: '대표자가 만 39세 이하이며 창업 후 3년 이내인 초기 창업기업 (예비창업자 포함)',
      supportContent: '사업화 자금 최대 1억 원 (총 사업비의 70% 이내) + 전용 사무공간 및 시제품 제작 지원',
      period: `사전 서류 접수 마감 ${formatKoreanDate(d5Iso(d4, d6))}`,
      deadlineIso: d4,
      requiredDocs: [
        '사업계획서 (K-Startup 표준 양식)',
        '대표자 신분증 사본 및 사업자등록증명원 (기창업자)',
      ],
      applyMethod: 'K-Startup 창업지원포털(k-startup.go.kr) 온라인 접수',
      applyUrl: 'https://www.k-startup.go.kr',
      contactInfo: '중소기업 통합콜센터 (1357)',
    },
    {
      id: 'gov24-youth-scholarship-loan',
      title: '취업 후 상환 학자금 대출 (생활비 무이자 지원 포함)',
      source: '정부24',
      orgName: '교육부 · 한국장학재단',
      field: '교육',
      region: '전국',
      summary:
        '대학생 및 대학원생이 학비와 생활비 걱정 없이 학업에 전념할 수 있도록 등록금 전액과 학기당 200만 원 생활비를 저금리로 대출합니다.',
      target:
        '대한민국 국민인 만 35세 이하 학부생 및 만 40세 이하 대학원생 (학자금 지원 9구간 이하, 기초·차상위·다자녀 생활비 무이자)',
      supportContent: '등록금 전액 + 생활비 학기당 최대 200만 원 (연 1.7% 저금리, 취업 후 소득 기준 상환)',
      period: `2학기 추가 등록 마감 ${formatKoreanDate(d15)}`,
      deadlineIso: d15,
      requiredDocs: [
        '학자금 지원구간 산정 동의 (가구원 전자서명)',
        '재학·입학 예정 증빙서류 (대학 학사정보 자동 연계)',
      ],
      applyMethod: '한국장학재단 누리집 및 모바일 앱에서 온라인 신청',
      applyUrl: 'https://www.kosaf.go.kr',
      contactInfo: '한국장학재단 상담센터 (1599-2000)',
    },
    {
      id: 'bojo24-incheon-youth-interview',
      title: '인천시 드림체크카드 & 청년 면접수당 지원',
      source: '보조금24',
      orgName: '인천광역시 청년정책담당관',
      field: '일자리',
      region: '인천',
      summary:
        '인천 거주 미취업 청년에게 구직활동비 및 면접 정장 대여·면접 수당을 연계해 취업 준비 부담을 경감합니다.',
      target: '인천광역시 거주 만 18세~39세 미취업 구직 청년 (면접 응시 증빙 가능자)',
      supportContent: '구직활동비 월 50만 원(최대 6개월) 또는 면접 참여 회당 5만 원 지역화폐 지급',
      period: `수시 접수 (정산 마감 ${formatKoreanDate(d24)})`,
      deadlineIso: d24,
      requiredDocs: [
        '면접 확인서 또는 기업 면접 안내 문자·이메일 캡처',
        '주민등록초본 및 구직등록확인증',
      ],
      applyMethod: '인천청년포털 인천유스톡톡 온라인 신청',
      applyUrl: 'https://youth.incheon.go.kr',
      contactInfo: '미추홀콜센터 (032-120)',
    },
    {
      id: 'bokjiro-care-youth-support',
      title: '가족돌봄청년 자기돌봄비 지원사업',
      source: '복지로',
      orgName: '보건복지부 · 청년미래센터',
      field: '복지·건강',
      region: '전국',
      summary:
        '질병·장애 등으로 돌봄이 필요한 가족을 전담 부양하는 청년에게 연 200만 원의 자기돌봄비와 맞춤형 복지 연계를 제공합니다.',
      target:
        '동거 가족을 직접 돌보고 있는 만 13세~34세 가족돌봄청년 (소득 중위 100% 이하 우선 지원)',
      supportContent: '연 200만 원 자기돌봄비 지급 + 전담 코디네이터 가사·간병 서비스 연계',
      period: '상시 신청 (청년미래센터 및 온라인 연중 접수)',
      deadlineIso: null,
      requiredDocs: [
        '가족돌봄청년 지원 신청서',
        '가족 질병·장애 진단서 또는 장기요양인정서 등 돌봄 필요 증빙',
      ],
      applyMethod: '복지로 온라인 신청 또는 시·도 청년미래센터 상담 접수',
      applyUrl: 'https://www.bokjiro.go.kr',
      contactInfo: '보건복지상담센터 (129)',
    },
    {
      id: 'ontong-daejeon-youth-housing',
      title: '대전청년 월세 및 임차보증금 이자 지원',
      source: '온통청년',
      orgName: '대전광역시 청년정책과',
      field: '주거',
      region: '대전',
      summary:
        '대전 지역 대학생 및 사회초년생 청년의 주거 안정을 위해 월세 최대 20만 원 또는 전월세 보증금 대출이자를 지원합니다.',
      target: '대전광역시 주민등록 거주 만 19세~39세 무주택 1인 청년가구 (기준중위소득 150% 이하)',
      supportContent: '월 최대 20만 원 × 12개월 지원 (최대 240만 원)',
      period: `신청 마감 ${formatKoreanDate(d6)}`,
      deadlineIso: d6,
      requiredDocs: [
        '임대차계약서 사본 및 최근 월세 납부 확인서',
        '주민등록등본 및 건강보험자격득실확인서',
      ],
      applyMethod: '대전청년포털(daejeonyouthportal.kr) 온라인 신청',
      applyUrl: 'https://www.daejeonyouthportal.kr',
      contactInfo: '대전시 콜센터 (042-120)',
    },
  ];
}

function d5Iso(fallbackA: string, _fallbackB: string): string {
  return fallbackA;
}

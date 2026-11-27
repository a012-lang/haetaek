import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
              청년모아
            </Link>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              온통청년·정부24·보조금24·복지로에 흩어진 청년 지원 정책을 한곳에서 조회하고,
              신청 요건과 서류를 빠르게 확인할 수 있는 통합 안내 플랫폼입니다.
            </p>
          </div>

          <nav aria-label="푸터 메뉴">
            <ul className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600">
              <li>
                <Link to="/" className="hover:text-slate-900">
                  홈
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-slate-900">
                  혜택 모아보기
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-slate-900">
                  AI 신청 도우미
                </Link>
              </li>
              <li>
                <Link to="/my-benefits" className="hover:text-slate-900">
                  내 혜택 &amp; 담당자
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>공공데이터 연계: 한국고용정보원 온통청년 · 행정안전부 보조금24/정부24 · 보건복지부 복지로</p>
          <p>정확한 최종 접수 자격은 각 소관 기관 공식 공고문을 기준으로 합니다.</p>
        </div>
      </div>
    </footer>
  );
}

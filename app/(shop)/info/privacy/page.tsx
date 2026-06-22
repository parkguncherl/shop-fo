import styles from './page.module.scss';

const BUSINESS_INFO = {
  companyName: 'GGUANGGU',
  representative: '박근철',
  businessNumber: '204-19-967-02',
  phone: '010-2746-6297',
  address: '경기도 이천시 신둔면 원적로 155번길 86-21',
  privacyEmail: '',
  effectiveDate: '2026년 6월 15일',
};

const collectionRows = [
  {
    purpose: '회원 식별 및 로그인',
    items: '카카오 계정 식별값, 닉네임, 이메일, 로그인 이력',
    retention: '회원 탈퇴 시까지',
  },
  {
    purpose: '상품 주문 및 배송',
    items: '주문자 정보, 수령인 이름, 연락처, 배송지 주소, 배송 요청사항, 주문 상품 정보',
    retention: '전자상거래 등 관계 법령에 따른 보관기간까지',
  },
  {
    purpose: '결제 및 취소, 환불 처리',
    items: '결제수단, 결제금액, 결제 승인번호, 거래 식별값, 취소 및 환불 이력',
    retention: '전자상거래 등 관계 법령에 따른 보관기간까지',
  },
  {
    purpose: '고객 문의 및 분쟁 대응',
    items: '문의 내용, 연락처, 주문번호, 상담 처리 이력',
    retention: '문의 처리 완료 후 3년 또는 관계 법령상 보관기간까지',
  },
];

const retentionRows = [
  { item: '계약 또는 청약철회 등에 관한 기록', period: '5년' },
  { item: '대금결제 및 재화 등의 공급에 관한 기록', period: '5년' },
  { item: '소비자 불만 또는 분쟁처리에 관한 기록', period: '3년' },
  { item: '표시·광고에 관한 기록', period: '6개월' },
];

export default function PrivacyPage() {
  const privacyContact = BUSINESS_INFO.privacyEmail || BUSINESS_INFO.phone;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>GGUANGGU</p>
        <h1>개인정보처리방침</h1>
        <p>
          GGUANGGU는 1인 사업자가 운영하는 온라인 쇼핑몰로서, 서비스 제공에 필요한 최소한의 개인정보만 처리합니다.
          처리하는 개인정보는 주문, 배송, 결제, 고객 응대 목적을 위해 사용되며 목적 외로 이용하지 않습니다.
        </p>
        <span>시행일: {BUSINESS_INFO.effectiveDate}</span>
      </header>

      <section className={styles.panel}>
        <h2>1. 개인정보 처리자 정보</h2>
        <dl className={styles.infoGrid}>
          <div>
            <dt>상호</dt>
            <dd>{BUSINESS_INFO.companyName}</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>{BUSINESS_INFO.representative}</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>{BUSINESS_INFO.businessNumber}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{BUSINESS_INFO.phone}</dd>
          </div>
          <div className={styles.fullLine}>
            <dt>주소</dt>
            <dd>{BUSINESS_INFO.address}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.panel}>
        <h2>2. 개인정보의 처리 목적 및 수집 항목</h2>
        <p>
          GGUANGGU는 아래 목적을 위해 필요한 개인정보를 수집·이용합니다. 이용자는 개인정보 제공을 거부할 수 있으나,
          필수 정보 제공을 거부하는 경우 회원 로그인, 주문, 배송, 결제 등 일부 서비스 이용이 제한될 수 있습니다.
        </p>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>처리 목적</th>
                <th>수집 항목</th>
                <th>보유 및 이용기간</th>
              </tr>
            </thead>
            <tbody>
              {collectionRows.map((row) => (
                <tr key={row.purpose}>
                  <td>{row.purpose}</td>
                  <td>{row.items}</td>
                  <td>{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>3. 개인정보의 보유 및 파기</h2>
        <p>
          개인정보는 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만, 관련 법령에 따라 보관해야 하는 정보는
          해당 기간 동안 분리하여 보관한 뒤 파기합니다.
        </p>
        <ul className={styles.list}>
          <li>전자적 파일: 복구할 수 없는 방법으로 삭제</li>
          <li>종이 문서: 분쇄 또는 소각</li>
        </ul>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>보관 항목</th>
                <th>보관 기간</th>
              </tr>
            </thead>
            <tbody>
              {retentionRows.map((row) => (
                <tr key={row.item}>
                  <td>{row.item}</td>
                  <td>{row.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          GGUANGGU는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 주문 상품 배송을 위해 택배사에
          수령인 이름, 연락처, 주소, 배송 요청사항 등 배송에 필요한 최소한의 정보를 제공할 수 있으며, 법령에 따른
          요청이 있는 경우 관계 법령에서 정한 범위 내에서 제공될 수 있습니다.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>5. 개인정보 처리 위탁</h2>
        <p>
          원활한 서비스 제공을 위해 아래 업무의 일부를 외부 서비스에 위탁할 수 있습니다. 위탁 시 개인정보가 안전하게
          처리되도록 필요한 사항을 확인하고 관리합니다.
        </p>
        <ul className={styles.list}>
          <li>카카오: 소셜 로그인 및 계정 인증</li>
          <li>포트원 및 연동 PG사: 결제 승인, 취소, 환불 처리</li>
          <li>택배사: 상품 배송 및 배송 조회</li>
          <li>호스팅·클라우드·문자/알림 서비스 제공사: 쇼핑몰 운영, 데이터 보관, 알림 발송</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>6. 이용자의 권리와 행사 방법</h2>
        <p>
          이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 요청은 개인정보
          보호책임자에게 연락하여 행사할 수 있으며, GGUANGGU는 본인 확인 후 지체 없이 처리합니다.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>7. 개인정보의 안전성 확보조치</h2>
        <ul className={styles.list}>
          <li>관리자 접근 권한을 대표자에게 한정하여 운영</li>
          <li>비밀번호, 인증정보 등 중요 정보의 안전한 보관 및 접근 통제</li>
          <li>개인정보 처리 시스템의 접속기록 관리</li>
          <li>개인정보가 포함된 자료의 무단 공개 및 유출 방지</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>8. 쿠키의 사용</h2>
        <p>
          GGUANGGU는 로그인 상태 유지, 장바구니 이용, 서비스 개선을 위해 쿠키를 사용할 수 있습니다. 이용자는
          브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>9. 개인정보 보호책임자</h2>
        <p>
          GGUANGGU는 1인 사업자로 운영되며, 대표자가 개인정보 보호책임자를 겸합니다. 개인정보와 관련한 문의,
          불만처리, 피해구제 요청은 아래 연락처로 문의해 주세요.
        </p>
        <dl className={styles.infoGrid}>
          <div>
            <dt>개인정보 보호책임자</dt>
            <dd>{BUSINESS_INFO.representative}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{privacyContact}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.panel}>
        <h2>10. 개인정보처리방침의 변경</h2>
        <p>
          본 개인정보처리방침은 시행일로부터 적용됩니다. 내용의 추가, 삭제 또는 수정이 있는 경우 쇼핑몰 공지 또는
          본 페이지를 통해 안내합니다.
        </p>
      </section>
    </main>
  );
}

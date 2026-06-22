import styles from '../privacy/page.module.scss';

export default function ShippingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>GGUANGGU</p>
        <h1>배송 / 반품 안내</h1>
        <p>GGUANGGU의 배송 및 반품·교환 정책을 안내합니다.</p>
      </header>

      <section className={styles.panel}>
        <h2>배송 안내</h2>
        <ul className={styles.list}>
          <li>배송완료까지 7~9일 소요됩니다.</li>
          <li>주문 후 상품 준비 및 포장 과정을 거쳐 발송되며, 발송 후 배송 조회가 가능합니다.</li>
          <li>도서·산간 지역은 추가 배송일이 소요될 수 있습니다.</li>
          <li>택배사 사정에 따라 배송 일정이 변동될 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>배송비</h2>
        <ul className={styles.list}>
          <li>기본 배송비가 적용됩니다. (결제 화면에서 확인 가능)</li>
          <li>일정 금액 이상 구매 시 무료 배송이 적용될 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>교환 / 반품 안내</h2>
        <ul className={styles.list}>
          <li>상품 수령 후 7일 이내에 교환·반품 신청이 가능합니다.</li>
          <li>고객 단순 변심에 의한 반품 시 왕복 배송비는 고객 부담입니다.</li>
          <li>상품 불량 또는 오배송의 경우 배송비 없이 교환·반품 처리합니다.</li>
          <li>착용, 세탁, 훼손된 상품은 교환·반품이 불가합니다.</li>
          <li>교환·반품은 고객센터로 문의 후 진행해 주세요.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>교환 / 반품 불가 사유</h2>
        <ul className={styles.list}>
          <li>착용 또는 세탁된 상품</li>
          <li>태그 제거 또는 상품이 훼손된 경우</li>
          <li>상품 수령 후 7일이 경과한 경우</li>
          <li>고객 부주의로 인한 상품 손상</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>고객센터</h2>
        <p>
          교환·반품 문의: <strong>ilovegguanggu@gmail.com</strong><br />
          운영 시간: 평일 10:00 ~ 17:00 (주말·공휴일 제외)
        </p>
      </section>
    </main>
  );
}

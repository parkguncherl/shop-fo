import styles from '../privacy/page.module.scss';

export default function ShippingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>맵시꾼</p>
        <h1>배송 / 반품 안내</h1>
        <p>맵시꾼의 배송 및 반품·교환 정책을 안내합니다.</p>
      </header>

      <section className={styles.panel}>
        <h2>배송 안내</h2>
        <ul className={styles.list}>
          <li>배송완료까지 7일 이내 소요됩니다.</li>
          <li>주문 후 상품 준비 및 포장 과정을 거쳐 발송되며, 발송 후 배송 조회가 가능합니다.</li>
          <li>도서·산간 지역은 추가 배송일이 소요될 수 있습니다.</li>
          <li>택배사 사정에 따라 배송 일정이 변동될 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>배송비</h2>
        <ul className={styles.list}>
          <li>
            기본 배송비는 <strong>3,000원</strong>입니다.
          </li>
          <li>
            아래 조건 중 하나라도 충족하면 <strong>무료배송</strong>이 적용됩니다.
          </li>
          <li>
            주문 금액 <strong>5만원 이상</strong>
          </li>
          <li>
            주문 상품 <strong>2건 이상</strong>
          </li>
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
        <h2>반품 · 교환 · 환불 신청 방법</h2>
        <p>주문내역에서 문의하기로 간편하게 신청할 수 있습니다.</p>
        <ol className={styles.steps}>
          <li>
            우측 상단 프로필에서 <strong>카카오 로그인</strong> 후 접속합니다.
          </li>
          <li>
            프로필 메뉴 → <strong>마이페이지 · 주문내역</strong>으로 이동합니다.
          </li>
          <li>해당 주문을 찾아 카드의 <strong>문의하기</strong> 버튼을 누릅니다.</li>
          <li>
            문의 유형에서 <strong>교환 / 반품 / 환불</strong>을 선택합니다.
          </li>
          <li>채팅창에 원하는 내용(사유·상품·수량 등)을 입력해 접수합니다.</li>
          <li>담당자가 접수 내용을 확인 후 채팅으로 안내드립니다.</li>
        </ol>
        <p style={{ marginTop: 16 }}>선택할 수 있는 문의 유형</p>
        <div className={styles.tagRow}>
          <span>색상 / 사이즈</span>
          <span>재고</span>
          <span>배송 문의</span>
          <span>교환 / 반품 / 환불</span>
          <span>주문 / 결제 확인</span>
          <span>취소</span>
        </div>
        <ul className={styles.list}>
          <li>
            채팅창 왼쪽의 <strong>사진 아이콘</strong>으로 이미지를 첨부할 수 있습니다. 상품 하자·오배송은 사진을 함께 보내주시면 확인이 신속합니다.
          </li>
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
          교환·반품·환불 문의: <strong>카카오 로그인 후 마이페이지 · 주문내역 → 문의하기</strong>에서 접수할 수 있습니다.
          <br />
          운영 시간: 평일 10:00 ~ 17:00 (주말·공휴일 제외) · 운영 시간 외 접수 건은 다음 영업일에 순차 안내됩니다.
        </p>
      </section>
    </main>
  );
}

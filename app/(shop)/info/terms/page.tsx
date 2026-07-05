import styles from '../privacy/page.module.scss';

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>맵시꾼</p>
        <h1>이용약관</h1>
        <p>맵시꾼 온라인 쇼핑몰 이용에 관한 약관입니다.</p>
        <span>시행일: 2026년 6월 15일</span>
      </header>

      <section className={styles.panel}>
        <h2>제1조 (목적)</h2>
        <p>
          이 약관은 맵시꾼(이하 "회사")가 운영하는 온라인 쇼핑몰에서 제공하는 서비스의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을
          목적으로 합니다.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>제2조 (정의)</h2>
        <ul className={styles.list}>
          <li>"쇼핑몰"이란 회사가 운영하는 온라인 쇼핑몰 맵시꾼(gguanggu.com)를 말합니다.</li>
          <li>"이용자"란 쇼핑몰에 접속하여 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
          <li>"회원"이란 쇼핑몰에 개인정보를 제공하고 소셜 로그인으로 가입한 자를 말합니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>제3조 (약관의 효력 및 변경)</h2>
        <ul className={styles.list}>
          <li>이 약관은 쇼핑몰 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
          <li>회사는 필요 시 약관을 변경할 수 있으며, 변경 시 공지사항을 통해 안내합니다.</li>
          <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>제4조 (서비스의 제공 및 변경)</h2>
        <ul className={styles.list}>
          <li>회사는 상품 판매, 주문·결제·배송 서비스를 제공합니다.</li>
          <li>회사는 운영상 필요에 따라 서비스 내용을 변경할 수 있으며, 변경 시 사전 공지합니다.</li>
          <li>서비스는 연중 24시간 제공을 원칙으로 하나, 시스템 점검 등으로 일시 중단될 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>제5조 (구매 및 결제)</h2>
        <ul className={styles.list}>
          <li>이용자는 쇼핑몰에서 제공하는 방법으로 상품을 주문하고 결제할 수 있습니다.</li>
          <li>회사는 주문 내용을 확인한 후 발송하며, 재고 부족 등의 사유로 취소될 수 있습니다.</li>
          <li>결제는 카카오페이 등 제공되는 결제 수단을 이용합니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>제6조 (청약철회 및 환불)</h2>
        <ul className={styles.list}>
          <li>이용자는 상품 수령 후 7일 이내에 청약철회(반품)를 할 수 있습니다.</li>
          <li>상품 훼손, 착용, 세탁 등 이용자 귀책 사유가 있는 경우 청약철회가 제한될 수 있습니다.</li>
          <li>환불은 취소 확인 후 결제 수단에 따라 처리됩니다.</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>제7조 (책임의 한계)</h2>
        <p>
          회사는 천재지변, 불가항력적 사유, 이용자 귀책 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다. 회사는 이용자 간 또는 이용자와 제3자 간에 발생한
          분쟁에 개입하지 않습니다.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>제8조 (준거법 및 관할)</h2>
        <p>이 약관은 대한민국 법령에 따라 해석되며, 서비스 이용으로 인한 분쟁은 민사소송법상의 관할 법원에서 해결합니다.</p>
      </section>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.scss';

const BUSINESS_INFO = {
  brand: 'GGUANGGU',
  companyName: '지성네트웍 태양광발전소',
  representative: '박근철',
  businessNumber: '204-19-967-02',
  phone: '010-2746-6297',
  address: '경기도 이천시 신둔면 원적로 155번길 86-21',
  businessType: '의류 및 패션잡화 소매업',
  items: '의류, 악세사리, 패션잡화',
  email: 'ilovegguanggu@gmail.com',
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <span className={styles.brand}>{BUSINESS_INFO.brand}</span>
          <nav className={styles.links} aria-label="푸터 메뉴">
            <Link href="/info/about">브랜드 소개</Link>
            <Link href="/info/privacy">개인정보처리방침</Link>
            <Link href="/info/terms">이용약관</Link>
            <Link href="/info/shipping">배송/반품 안내</Link>
          </nav>
        </div>

        <dl className={styles.businessInfo} aria-label="사업자 정보">
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
            <dt>유선번호</dt>
            <dd>{BUSINESS_INFO.phone}</dd>
          </div>
          <div className={styles.fullLine}>
            <dt>주소</dt>
            <dd>{BUSINESS_INFO.address}</dd>
          </div>
          <div>
            <dt>업종</dt>
            <dd>{BUSINESS_INFO.businessType}</dd>
          </div>
          <div>
            <dt>판매품목</dt>
            <dd>{BUSINESS_INFO.items}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{BUSINESS_INFO.email}</dd>
          </div>
        </dl>

        <p className={styles.notice}>GGUANGGU는 의류와 악세사리를 판매하는 온라인 쇼핑몰입니다.</p>
        <p className={styles.copy}>© 2025 GGUANGGU. All rights reserved.</p>
      </div>
    </footer>
  );
}

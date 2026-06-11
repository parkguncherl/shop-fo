import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.scss';

const BUSINESS_INFO = {
  brand: 'GGUANGGU',
  companyName: 'GGUANGGU',
  representative: '대표자명 입력',
  businessNumber: '사업자등록번호 입력',
  phone: '유선번호 입력',
  address: '사업장 주소 입력',
  businessType: '의류 및 패션잡화 소매업',
  items: '의류, 악세사리, 패션잡화',
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
        </dl>

        <p className={styles.notice}>GGUANGGU는 의류와 악세사리를 판매하는 온라인 쇼핑몰입니다.</p>
        <p className={styles.copy}>© 2025 GGUANGGU. All rights reserved.</p>
      </div>
    </footer>
  );
}
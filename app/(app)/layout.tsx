import React from 'react';
import stylesForLayout from '../../styles/layout/layout.module.scss
import '../../styles/layout/header.scss';
import Navs from '../../components/layout/header/Navs';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`customerLayout ${stylesForLayout.layout}`}>
      <header className={'header'}>
        <div className={'left'}>
          <Navs />
        </div>

        <div className={'center'}></div>

        <div className={'right'}></div>
      </header>
    </div>
  );
};
export default layout;

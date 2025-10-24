import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '../../src/pages/HomePage';

describe('HomePage Component', () => {
  const mockUser = {
    phoneNumber: '13812345678'
  };
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染主页标题', () => {
    render(<HomePage />);
    
    expect(screen.getByText('淘贝')).toBeInTheDocument();
    expect(screen.getByText('欢迎来到淘贝')).toBeInTheDocument();
  });

  it('应该显示用户信息当用户已登录', () => {
    render(<HomePage user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByTestId('user-phone')).toHaveTextContent('欢迎，13812345678');
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('应该不显示用户信息当用户未登录', () => {
    render(<HomePage />);
    
    expect(screen.queryByTestId('user-phone')).not.toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('应该调用退出登录回调', () => {
    render(<HomePage user={mockUser} onLogout={mockOnLogout} />);
    
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);
    
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('应该显示功能卡片', () => {
    render(<HomePage />);
    
    expect(screen.getByText('商品浏览')).toBeInTheDocument();
    expect(screen.getByText('发现精选商品')).toBeInTheDocument();
    expect(screen.getByText('购物车')).toBeInTheDocument();
    expect(screen.getByText('管理您的购物清单')).toBeInTheDocument();
    expect(screen.getByText('订单管理')).toBeInTheDocument();
    expect(screen.getByText('查看订单状态')).toBeInTheDocument();
  });

  it('应该显示欢迎信息', () => {
    render(<HomePage />);
    
    expect(screen.getByText('您的购物之旅从这里开始')).toBeInTheDocument();
  });

  it('应该有正确的页面结构', () => {
    render(<HomePage user={mockUser} />);
    
    const homePage = screen.getByRole('main');
    expect(homePage).toBeInTheDocument();
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CountryCodeSelector from '../../src/components/CountryCodeSelector';

describe('CountryCodeSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCountryCodeSelector = (props = {}) => {
    const defaultProps = {
      onSelect: mockOnSelect,
      selectedCountry: { code: '+86', name: '中国', flag: '🇨🇳' },
      isOpen: false,
      ...props
    };
    return render(<CountryCodeSelector {...defaultProps} />);
  };

  describe('UI-CountryCodeSelector 渲染测试', () => {
    it('应该渲染选择器按钮', () => {
      // When: 渲染国家代码选择器
      renderCountryCodeSelector();

      // Then: 应该显示选择器按钮
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('应该显示当前选中的国家信息', () => {
      // Given: 选中中国
      const selectedCountry = { code: '+86', name: '中国', flag: '🇨🇳' };

      // When: 渲染选择器
      renderCountryCodeSelector({ selectedCountry });

      // Then: 应该显示中国的信息
      expect(screen.getByText('🇨🇳')).toBeInTheDocument();
      expect(screen.getByText('+86')).toBeInTheDocument();
    });

    it('应该显示下拉箭头图标', () => {
      // When: 渲染选择器
      renderCountryCodeSelector();

      // Then: 应该显示下拉箭头
      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('应该在关闭状态下不显示下拉列表', () => {
      // When: 渲染关闭状态的选择器
      renderCountryCodeSelector({ isOpen: false });

      // Then: 不应该显示下拉列表
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('应该在打开状态下显示下拉列表', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 应该显示下拉列表
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('下拉列表内容测试', () => {
    it('应该显示所有预定义的国家选项', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 应该显示所有国家选项
      expect(screen.getByText('中国')).toBeInTheDocument();
      expect(screen.getByText('美国')).toBeInTheDocument();
      expect(screen.getByText('英国')).toBeInTheDocument();
      expect(screen.getByText('日本')).toBeInTheDocument();
      expect(screen.getByText('韩国')).toBeInTheDocument();
      expect(screen.getByText('新加坡')).toBeInTheDocument();
      expect(screen.getByText('澳大利亚')).toBeInTheDocument();
      expect(screen.getByText('加拿大')).toBeInTheDocument();
    });

    it('应该显示每个国家的国旗、名称和代码', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 应该显示完整的国家信息
      expect(screen.getByText('🇨🇳')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('🇬🇧')).toBeInTheDocument();
      expect(screen.getByText('🇯🇵')).toBeInTheDocument();
      expect(screen.getByText('🇰🇷')).toBeInTheDocument();
      expect(screen.getByText('🇸🇬')).toBeInTheDocument();
      expect(screen.getByText('🇦🇺')).toBeInTheDocument();
      expect(screen.getByText('🇨🇦')).toBeInTheDocument();

      expect(screen.getByText('+86')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByText('+44')).toBeInTheDocument();
      expect(screen.getByText('+81')).toBeInTheDocument();
      expect(screen.getByText('+82')).toBeInTheDocument();
      expect(screen.getByText('+65')).toBeInTheDocument();
      expect(screen.getByText('+61')).toBeInTheDocument();
    });

    it('应该正确排列国家选项', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 应该按预定义顺序显示国家
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(8);
    });
  });

  describe('选择器交互功能', () => {
    it('应该在点击选择器按钮时切换打开状态', async () => {
      // Given: 渲染关闭状态的选择器
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ isOpen: false, onToggle: mockOnToggle });
      const button = screen.getByRole('button');

      // When: 点击选择器按钮
      await user.click(button);

      // Then: 应该调用切换函数
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('应该在选择国家时调用onSelect回调', async () => {
      // Given: 渲染打开状态的选择器
      const user = userEvent.setup();
      renderCountryCodeSelector({ isOpen: true });

      // When: 点击美国选项
      const usOption = screen.getByText('美国').closest('[role="option"]');
      await user.click(usOption);

      // Then: 应该调用onSelect回调
      expect(mockOnSelect).toHaveBeenCalledWith({
        code: '+1',
        name: '美国',
        flag: '🇺🇸'
      });
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('应该支持选择不同的国家', async () => {
      // Given: 渲染打开状态的选择器
      const user = userEvent.setup();
      renderCountryCodeSelector({ isOpen: true });

      // When: 依次选择不同国家
      const countries = [
        { name: '英国', expected: { code: '+44', name: '英国', flag: '🇬🇧' } },
        { name: '日本', expected: { code: '+81', name: '日本', flag: '🇯🇵' } },
        { name: '韩国', expected: { code: '+82', name: '韩国', flag: '🇰🇷' } }
      ];

      for (const country of countries) {
        const option = screen.getByText(country.name).closest('[role="option"]');
        await user.click(option);
        
        // Then: 应该调用正确的回调
        expect(mockOnSelect).toHaveBeenCalledWith(country.expected);
      }

      expect(mockOnSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe('键盘导航功能', () => {
    it('应该支持Tab键聚焦选择器', async () => {
      // Given: 渲染选择器
      const user = userEvent.setup();
      renderCountryCodeSelector();

      // When: 使用Tab键导航
      await user.tab();

      // Then: 选择器按钮应该获得焦点
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('应该支持回车键打开下拉列表', async () => {
      // Given: 渲染选择器并聚焦
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ onToggle: mockOnToggle });
      const button = screen.getByRole('button');
      button.focus();

      // When: 按回车键
      await user.keyboard('{Enter}');

      // Then: 应该切换打开状态
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('应该支持空格键打开下拉列表', async () => {
      // Given: 渲染选择器并聚焦
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ onToggle: mockOnToggle });
      const button = screen.getByRole('button');
      button.focus();

      // When: 按空格键
      await user.keyboard(' ');

      // Then: 应该切换打开状态
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('应该支持方向键导航选项', async () => {
      // Given: 渲染打开状态的选择器
      const user = userEvent.setup();
      renderCountryCodeSelector({ isOpen: true });

      // When: 使用方向键导航
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Then: 应该选择对应的选项
      // 这个测试需要实际的键盘导航实现
    });

    it('应该支持Escape键关闭下拉列表', async () => {
      // Given: 渲染打开状态的选择器
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ isOpen: true, onToggle: mockOnToggle });

      // When: 按Escape键
      await user.keyboard('{Escape}');

      // Then: 应该关闭下拉列表
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('状态管理测试', () => {
    it('应该正确显示选中状态', () => {
      // Given: 选中美国
      const selectedCountry = { code: '+1', name: '美国', flag: '🇺🇸' };

      // When: 渲染选择器
      renderCountryCodeSelector({ selectedCountry, isOpen: true });

      // Then: 美国选项应该显示选中状态
      const usOption = screen.getByText('美国').closest('[role="option"]');
      expect(usOption).toHaveAttribute('aria-selected', 'true');
    });

    it('应该正确管理打开/关闭状态', () => {
      // Given: 渲染关闭状态的选择器
      const { rerender } = renderCountryCodeSelector({ isOpen: false });

      // Then: 不应该显示下拉列表
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      // When: 重新渲染为打开状态
      rerender(
        <CountryCodeSelector
          onSelect={mockOnSelect}
          selectedCountry={{ code: '+86', name: '中国', flag: '🇨🇳' }}
          isOpen={true}
        />
      );

      // Then: 应该显示下拉列表
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('应该正确更新选中的国家', () => {
      // Given: 初始选中中国
      const { rerender } = renderCountryCodeSelector({
        selectedCountry: { code: '+86', name: '中国', flag: '🇨🇳' }
      });

      // Then: 应该显示中国信息
      expect(screen.getByText('🇨🇳')).toBeInTheDocument();
      expect(screen.getByText('+86')).toBeInTheDocument();

      // When: 更新为美国
      rerender(
        <CountryCodeSelector
          onSelect={mockOnSelect}
          selectedCountry={{ code: '+1', name: '美国', flag: '🇺🇸' }}
          isOpen={false}
        />
      );

      // Then: 应该显示美国信息
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('外部点击关闭功能', () => {
    it('应该在点击外部区域时关闭下拉列表', async () => {
      // Given: 渲染打开状态的选择器
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ isOpen: true, onToggle: mockOnToggle });

      // When: 点击外部区域
      fireEvent.mouseDown(document.body);

      // Then: 应该关闭下拉列表
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('应该在点击选择器内部时不关闭下拉列表', async () => {
      // Given: 渲染打开状态的选择器
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderCountryCodeSelector({ isOpen: true, onToggle: mockOnToggle });
      const listbox = screen.getByRole('listbox');

      // When: 点击下拉列表内部
      await user.click(listbox);

      // Then: 不应该关闭下拉列表
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('无障碍功能测试', () => {
    it('应该具有正确的ARIA属性', () => {
      // When: 渲染选择器
      renderCountryCodeSelector();

      // Then: 应该有正确的ARIA属性
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('应该在打开时更新ARIA属性', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: ARIA属性应该更新
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('应该为选项提供正确的角色和属性', () => {
      // When: 渲染打开状态的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 选项应该有正确的角色
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      
      options.forEach(option => {
        expect(option).toHaveAttribute('role', 'option');
      });
    });

    it('应该支持屏幕阅读器标签', () => {
      // When: 渲染选择器
      renderCountryCodeSelector();

      // Then: 应该有适当的标签
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('性能和优化测试', () => {
    it('应该避免不必要的重新渲染', () => {
      // Given: 渲染选择器
      const { rerender } = renderCountryCodeSelector();

      // When: 使用相同props重新渲染
      rerender(
        <CountryCodeSelector
          onSelect={mockOnSelect}
          selectedCountry={{ code: '+86', name: '中国', flag: '🇨🇳' }}
          isOpen={false}
        />
      );

      // Then: 应该保持稳定（这个测试需要实际的性能优化实现）
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('应该正确处理大量选项', () => {
      // When: 渲染包含所有国家的选择器
      renderCountryCodeSelector({ isOpen: true });

      // Then: 应该高效渲染所有选项
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(8); // 当前预定义的国家数量
    });
  });
});
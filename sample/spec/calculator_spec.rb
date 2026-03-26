# frozen_string_literal: true

require_relative '../lib/calculator'

RSpec.describe Calculator do
  describe '#add' do
    it 'adds two numbers' do
      expect(described_class.new.add(1, 2)).to eq(3)
    end

    it 'adds negative numbers' do
      expect(described_class.new.add(-1, -2)).to eq(-3)
    end

    it 'adds with zero' do
      expect(described_class.new.add(0, 5)).to eq(5)
    end

    it 'adds floats' do
      expect(described_class.new.add(1.5, 2.25)).to eq(3.75)
    end

    it 'raises TypeError for non-numeric arguments' do
      expect { described_class.new.add(1, '2') }.to raise_error(TypeError)
    end
  end

  describe '#div' do
    it 'divides two numbers' do
      expect(described_class.new.div(10, 2)).to eq(5)
    end

    it 'returns 0 when numerator is 0' do
      expect(described_class.new.div(0, 5)).to eq(0)
    end

    it 'raises error when dividing by zero' do
      expect { described_class.new.div(1, 0) }.to raise_error(ZeroDivisionError)
    end

    it 'raises TypeError for non-numeric arguments' do
      expect { described_class.new.div(1, '2') }.to raise_error(TypeError)
    end
  end

  describe 'intentional failures (for UI testing)' do
    it 'fails intentionally', :intentional_failure do
      # This spec is meant to demonstrate failing output in the test UI.
      expect(described_class.new.add(1, 2)).to eq(4)
    end
  end
end

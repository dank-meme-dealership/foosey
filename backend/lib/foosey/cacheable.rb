module Foosey
  @cache = Hash.new { |h, k| h[k] = {} }

  def self.cache
    @cache
  end

  class Cacheable
    def self.new(*args)
      Foosey.cache[self.name][args[0]] || begin
        obj = allocate
        obj.send(:initialize, *args)
        Foosey.cache[self.name][args[0]] = obj
      end
    end
  end
end

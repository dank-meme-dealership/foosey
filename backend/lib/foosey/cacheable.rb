module Foosey
  @cache = Hash.new { |h, k| h[k] = {} }

  def self.cache
    @cache
  end

  class Cacheable
    def self.new(*args)
      @cache_id = args[0]
      Foosey.cache[name][args[0]] || begin
        obj = allocate
        obj.send(:initialize, *args)
        Foosey.cache[name][args[0]] = obj
      end
    end

    def invalidate
      Foosey.cache[name].delete(@cache_id)
    end
  end
end

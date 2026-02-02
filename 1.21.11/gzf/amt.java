import com.google.common.collect.MapMaker;
import com.mojang.serialization.Codec;
import io.netty.buffer.ByteBuf;
import java.util.Optional;
import java.util.concurrent.ConcurrentMap;

public class amt<T> {
   private static final ConcurrentMap<amt.a, amt<?>> a = (new MapMaker()).weakValues().makeMap();
   private final amo b;
   private final amo c;

   public static <T> Codec<amt<T>> a(amt<? extends jq<T>> $$0) {
      return amo.a.xmap(($$1) -> {
         return a($$0, $$1);
      }, amt::a);
   }

   public static <T> aao<ByteBuf, amt<T>> b(amt<? extends jq<T>> $$0) {
      return amo.b.a(($$1) -> {
         return a($$0, $$1);
      }, amt::a);
   }

   public static <T> amt<T> a(amt<? extends jq<T>> $$0, amo $$1) {
      return a($$0.c, $$1);
   }

   public static <T> amt<jq<T>> a(amo $$0) {
      return a(mj.a, $$0);
   }

   private static <T> amt<T> a(amo $$0, amo $$1) {
      return (amt)a.computeIfAbsent(new amt.a($$0, $$1), ($$0x) -> {
         return new amt($$0x.a, $$0x.b);
      });
   }

   private amt(amo $$0, amo $$1) {
      this.b = $$0;
      this.c = $$1;
   }

   public String toString() {
      String var10000 = String.valueOf(this.b);
      return "ResourceKey[" + var10000 + " / " + String.valueOf(this.c) + "]";
   }

   public boolean c(amt<? extends jq<?>> $$0) {
      return this.b.equals($$0.a());
   }

   public <E> Optional<amt<E>> d(amt<? extends jq<E>> $$0) {
      return this.c($$0) ? Optional.of(this) : Optional.empty();
   }

   public amo a() {
      return this.c;
   }

   public amo b() {
      return this.b;
   }

   public amt<jq<T>> c() {
      return a(this.b);
   }

   static record a(amo a, amo b) {
      final amo a;
      final amo b;

      a(amo param1, amo param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public amo a() {
         return this.a;
      }

      public amo b() {
         return this.b;
      }
   }
}

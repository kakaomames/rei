import acd.1;
import io.netty.buffer.ByteBuf;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface acd {
   acd.b<? extends acd> a();

   static <B extends ByteBuf, T extends acd> aao<B, T> a(aar<B, T> $$0, aap<B, T> $$1) {
      return aao.a($$0, $$1);
   }

   static <T extends acd> acd.b<T> a(String $$0) {
      return new acd.b(amo.b($$0));
   }

   static <B extends wx> aao<B, acd> a(acd.a<B> $$0, List<acd.c<? super B, ?>> $$1) {
      Map<amo, aao<? super B, ? extends acd>> $$2 = (Map)$$1.stream().collect(Collectors.toUnmodifiableMap(($$0x) -> {
         return $$0x.a().a();
      }, acd.c::b));
      return new 1($$2, $$0);
   }

   public static record b<T extends acd>(amo a) {
      final amo a;

      public b(amo param1) {
         this.a = $$0;
      }

      public amo a() {
         return this.a;
      }
   }

   public interface a<B extends wx> {
      aao<B, ? extends acd> create(amo var1);
   }

   public static record c<B extends wx, T extends acd>(acd.b<T> a, aao<B, T> b) {
      public c(acd.b<T> param1, aao<B, T> param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public acd.b<T> a() {
         return this.a;
      }

      public aao<B, T> b() {
         return this.b;
      }
   }
}

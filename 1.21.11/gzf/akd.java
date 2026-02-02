import io.netty.buffer.ByteBuf;
import java.util.Optional;
import java.util.function.IntFunction;

public record akd(is b, akd.a c, emz.a d) implements aay<aib> {
   public static final aao<xq, akd> a;

   public akd(is $$0, akd.a $$1, Optional<amt<tb>> $$2, jy $$3, egm $$4, boolean $$5) {
      this($$0, $$1, new emz.a($$2, $$3, $$4, $$5, emz.c.a, Optional.empty()));
   }

   public akd(is param1, akd.a param2, emz.a param3) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public aba<akd> a() {
      return ahz.cq;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public is b() {
      return this.b;
   }

   public akd.a e() {
      return this.c;
   }

   public emz.a f() {
      return this.d;
   }

   static {
      a = aao.a(is.b, akd::b, akd.a.h, akd::e, emz.a.b, akd::f, akd::new);
   }

   public static enum a {
      a(0),
      b(1),
      c(2),
      d(3),
      e(4),
      f(5),
      g(6);

      private static final IntFunction<akd.a> i = beu.a(($$0) -> {
         return $$0.j;
      }, values(), (beu.a)beu.a.a);
      public static final aao<ByteBuf, akd.a> h = aam.a(i, ($$0) -> {
         return $$0.j;
      });
      private final int j;

      private a(final int param3) {
         this.j = $$0;
      }

      // $FF: synthetic method
      private static akd.a[] a() {
         return new akd.a[]{a, b, c, d, e, f, g};
      }
   }
}

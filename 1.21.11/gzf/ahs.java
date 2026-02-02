import io.netty.buffer.ByteBuf;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.IntFunction;

public record ahs(ahs.a b, fvr c) implements aay<adb> {
   public static final aao<xq, ahs> a;

   public ahs(ahs.a param1, fvr param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public static ahs a(UUID $$0) {
      return new ahs(ahs.a.b, fvr.a($$0));
   }

   public static ahs a(UUID $$0, fvt.a $$1, jy $$2) {
      return new ahs(ahs.a.a, fvr.a($$0, $$1, $$2));
   }

   public static ahs b(UUID $$0, fvt.a $$1, jy $$2) {
      return new ahs(ahs.a.c, fvr.a($$0, $$1, $$2));
   }

   public static ahs a(UUID $$0, fvt.a $$1, dvu $$2) {
      return new ahs(ahs.a.a, fvr.a($$0, $$1, $$2));
   }

   public static ahs b(UUID $$0, fvt.a $$1, dvu $$2) {
      return new ahs(ahs.a.c, fvr.a($$0, $$1, $$2));
   }

   public static ahs a(UUID $$0, fvt.a $$1, float $$2) {
      return new ahs(ahs.a.a, fvr.a($$0, $$1, $$2));
   }

   public static ahs b(UUID $$0, fvt.a $$1, float $$2) {
      return new ahs(ahs.a.c, fvr.a($$0, $$1, $$2));
   }

   public aba<ahs> a() {
      return ahz.bp;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public void a(fvs $$0) {
      this.b.f.accept($$0, this.c);
   }

   public ahs.a b() {
      return this.b;
   }

   public fvr e() {
      return this.c;
   }

   static {
      a = aao.a(ahs.a.e, ahs::b, fvr.a, ahs::e, ahs::new);
   }

   static enum a {
      a(fvu::c),
      b(fvu::a),
      c(fvu::b);

      final BiConsumer<fvs, fvr> f;
      public static final IntFunction<ahs.a> d = beu.a(Enum::ordinal, values(), (beu.a)beu.a.b);
      public static final aao<ByteBuf, ahs.a> e = aam.a(d, Enum::ordinal);

      private a(final BiConsumer<fvs, fvr> param3) {
         this.f = $$0;
      }

      // $FF: synthetic method
      private static ahs.a[] a() {
         return new ahs.a[]{a, b, c};
      }
   }
}

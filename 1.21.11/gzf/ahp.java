import java.util.Optional;

public record ahp(yh b, Optional<jy> c) implements aay<adb> {
   public static final aao<xq, ahp> a;

   public ahp(yh param1, Optional<jy> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ahp> a() {
      return ahz.bj;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public yh b() {
      return this.b;
   }

   public Optional<jy> e() {
      return this.c;
   }

   static {
      a = aao.a(yj.b, ahp::b, aam.a(jy.h), ahp::e, ahp::new);
   }
}

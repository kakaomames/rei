import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

public record aex(fmu b, byte c, boolean d, Optional<List<fmq>> e, Optional<fmw.c> f) implements aay<adb> {
   public static final aao<xq, aex> a;

   public aex(fmu $$0, byte $$1, boolean $$2, @Nullable Collection<fmq> $$3, @Nullable fmw.c $$4) {
      this($$0, $$1, $$2, $$3 != null ? Optional.of(List.copyOf($$3)) : Optional.empty(), Optional.ofNullable($$4));
   }

   public aex(fmu param1, byte param2, boolean param3, Optional<List<fmq>> param4, Optional<fmw.c> param5) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   public aba<aex> a() {
      return ahz.U;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public void a(fmw $$0) {
      Optional var10000 = this.e;
      Objects.requireNonNull($$0);
      var10000.ifPresent($$0::a);
      this.f.ifPresent(($$1) -> {
         $$1.a($$0);
      });
   }

   public fmu b() {
      return this.b;
   }

   public byte e() {
      return this.c;
   }

   public boolean f() {
      return this.d;
   }

   public Optional<List<fmq>> g() {
      return this.e;
   }

   public Optional<fmw.c> h() {
      return this.f;
   }

   static {
      a = aao.a(fmu.b, aex::b, aam.c, aex::e, aam.b, aex::f, fmq.a.a(aam.a()).a(aam::a), aex::g, fmw.c.a, aex::h, aex::new);
   }
}
